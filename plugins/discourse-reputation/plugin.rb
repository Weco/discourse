# name: discourse-reputation
# about: User reputation system based on rating for posts
# version: 0.1
# author: V

register_asset "stylesheets/reputation.scss"

# load the engine
load File.expand_path('../lib/discourse_reputation/engine.rb', __FILE__)

after_initialize do
  require_dependency 'post_serializer'
  class ::PostSerializer
    attributes :has_rating, :rating

    def has_rating
      object.topic.tags.map(&:name).include?('problem')
    end

    def rating
      object.rating.to_i
    end
  end

  require_dependency 'post'
  class ::Post
    def rating
      if self.custom_fields["rating"]
        return self.custom_fields["rating"]
      else
        Set.new(
          PostCustomField
            .where(name: "rating", value: 0)
            .pluck(:post_id)
        )
        return 0
      end
    end
  end

  Post.register_custom_field_type('votes', :json)
  Post.register_custom_field_type('rating', :integer)

  require_dependency 'topic'
  class ::Topic
    def has_rating
      self.tags.map(&:name).include?('problem')
    end

    def rating
      if self.custom_fields["rating"]
        return self.custom_fields["rating"]
      else
        Set.new(
          TopicCustomField
            .where(name: "rating", value: 0)
            .pluck(:topic_id)
        )
        return 0
      end
    end
  end

  add_to_serializer(:topic_list_item, :rating) { object.rating }
  add_to_serializer(:topic_list_item, :has_rating) { object.has_rating }

  class ::Guardian
    def check_reputation(min)
      return is_staff? || user && user.reputation.to_i >= min.to_i
    end

    def can_create_tag?
      check_reputation(SiteSetting.reputation_min_value_to_create_tag)
    end

    def can_edit_topic?(topic)
      return false if Discourse.static_doc_topic_ids.include?(topic.id) && !is_admin?
      return false unless can_see?(topic)

      return true if is_admin?
      return true if check_reputation(SiteSetting.reputation_min_value_to_edit_topics) && can_create_post?(topic)

      # TL4 users can edit archived topics, but can not edit private messages
      return true if (topic.archived && !topic.private_message? && user.has_trust_level?(TrustLevel[4]) && can_create_post?(topic))

      # TL3 users can not edit archived topics and private messages
      return true if (!topic.archived && !topic.private_message? && user.has_trust_level?(TrustLevel[3]) && can_create_post?(topic))

      return false if topic.archived
      is_my_own?(topic) && !topic.edit_time_limit_expired?
    end

    def can_delete_topic?(topic)
      !topic.trashed? &&
      check_reputation(SiteSetting.reputation_min_value_to_delete_topics) &&
      !(Category.exists?(topic_id: topic.id)) &&
      !Discourse.static_doc_topic_ids.include?(topic.id)
    end

    def can_edit_wiki?(post)
      return true if is_admin?

      if is_my_own?(post)
        if post.hidden?
          return false if post.hidden_at.present? &&
            post.hidden_at >= SiteSetting.cooldown_minutes_after_hiding_posts.minutes.ago

          # If it's your own post and it's hidden, you can still edit it
          return true
        end

        return !post.edit_time_limit_expired?
      end

      check_reputation(SiteSetting.reputation_min_value_to_edit_wiki)
    end

    def can_edit_post?(post)
      if Discourse.static_doc_topic_ids.include?(post.topic_id) && !is_admin?
        return false
      end

      return true if is_admin?

      if check_reputation(SiteSetting.reputation_min_value_to_edit_topics) || @user.has_trust_level?(TrustLevel[4])
        return can_create_post?(post.topic)
      end

      if post.topic.archived? || post.user_deleted || post.deleted_at
        return false
      end

      if post.wiki && can_edit_wiki?(post)
        return true
      end

      if is_my_own?(post)
        if post.hidden?
          return false if post.hidden_at.present? &&
            post.hidden_at >= SiteSetting.cooldown_minutes_after_hiding_posts.minutes.ago

          # If it's your own post and it's hidden, you can still edit it
          return true
        end

        return !post.edit_time_limit_expired?
      end

      false
    end

    def can_delete_post?(post)
      # Can't delete the first post
      return false if post.is_first_post?

      # Can't delete after post_edit_time_limit minutes have passed
      return false if !is_staff? && post.edit_time_limit_expired?

      # Can't delete posts in archived topics unless you are staff
      return false if !is_staff? && post.topic.archived?

      # You can delete your own posts
      return !post.user_deleted? if is_my_own?(post)

      check_reputation(SiteSetting.reputation_min_value_to_delete_topics)
    end
  end

  require_dependency 'user'
  class ::User
    def reputation
      if !self.custom_fields["reputation"]
        self.custom_fields["reputation"] = 1
        self.save_custom_fields(true)
      end

      return self.custom_fields["reputation"]
    end
  end

  add_to_serializer(:current_user, :reputation) { object.reputation }
  add_to_serializer(:user, :reputation) { object.reputation }

  require_dependency 'users_controller'

  module UsersControllerExtension
    def update
      # filter reputation for non-staff users
      if params["custom_fields"] && params["custom_fields"]["reputation"] && !current_user.staff?
        params[:custom_fields].delete :reputation
      end

      super
    end
  end

  class ::UsersController
    prepend UsersControllerExtension
  end

  require_dependency 'topic_query'
  class ::TopicQuery
    SORTABLE_MAPPING["votes"] = "custom_fields.rating"
  end

  Discourse::Application.routes.append do
    mount ::DiscourseReputation::Engine, at: "/rating"
  end

  TopicList.preloaded_custom_fields << "rating" if TopicList.respond_to? :preloaded_custom_fields
end
