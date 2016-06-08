module DiscourseReputation
  class RatingController < ::ApplicationController
    requires_plugin 'discourse-reputation'

    def up
      change_rating(params, 1)
    end

    def down
      change_rating(params, -1)
    end

    def change_rating(params, value)
      if !current_user
        return render_json_error(I18n.t("not_logged_in"))
      end

      post = Post.find_by(id: params["post_id"])

      if current_user.id == post.user_id
        return render_json_error(I18n.t("reputation.cant_vote_for_own_post"))
      end

      type = value == 1 ? 'up' : 'down'
      min_reputation = SiteSetting.send("reputation_min_value_to_vote_#{type}")

      if current_user.reputation.to_i < min_reputation.to_i
        return render_json_error(I18n.t("reputation.not_enough_reputation_for_vote", min: min_reputation, type: type))
      end

      rated_users = post.custom_fields["rated_users"]

      if !rated_users.kind_of?(Array)
        rated_users = rated_users.kind_of?(String) ? [rated_users] : []
      end

      if !rated_users.map(&:to_i).include?(current_user.id)
        post.custom_fields["rating_count"] = [(post.custom_fields["rating_count"].to_i + value), 0].max
        post.custom_fields["rated_users"] = rated_users.dup.push(current_user.id)
        post.save_custom_fields(true)

        if post.post_number == 1
          topic = Topic.find_by(id: post.topic_id)
          topic.custom_fields["rating_count"] = post.custom_fields["rating_count"]
          topic.save_custom_fields(true)
        end

        post_user = User.find_by(id: post.user_id)

        if value == 1
          value *= post.post_number == 1 ? 10 : 5
        else
          value *= 2
        end

        post_user.custom_fields["reputation"] = [(post_user.reputation.to_i + value), 1].max
        post_user.save_custom_fields(true)

        obj = {
          rating_count: post.custom_fields["rating_count"].to_i
        }

        render json: obj
      else
        return render_json_error(I18n.t("reputation.already_voted"))
      end
    end
  end
end
