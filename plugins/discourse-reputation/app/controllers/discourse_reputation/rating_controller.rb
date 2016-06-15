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

      is_up = value == 1
      type = is_up ? 'up' : 'down'
      min_reputation = SiteSetting.send("reputation_min_value_to_vote_#{type}")

      if !current_user.staff? && current_user.reputation.to_i < min_reputation.to_i
        return render_json_error(I18n.t("reputation.not_enough_reputation_for_vote", min: min_reputation, type: type))
      end

      votes = post.custom_fields["votes"]

      if !votes.kind_of?(Hash)
        votes = {}
      end

      current_user_vote = votes[current_user.id.to_s]

      if current_user_vote == nil || current_user_vote['value'] != value
        is_revote = current_user_vote != nil
        rating = post.custom_fields["rating"].to_i + value

        if is_revote
          rating += value
        end

        votes[current_user.id.to_s] = {
          value: value,
          created_at: Time.now
        }
        post.custom_fields["rating"] = rating
        post.custom_fields["votes"] = votes
        post.save_custom_fields(true)

        if post.post_number == 1
          topic = Topic.find_by(id: post.topic_id)
          topic.custom_fields["rating"] = post.custom_fields["rating"]
          topic.save_custom_fields(true)
        end

        post_user = User.find_by(id: post.user_id)

        if is_up
          value *= post.post_number == 1 ? 10 : 5
        else
          value *= 2
        end

        # If it's re-voting then roll back changing of user reputation from previous voting
        if is_revote
          if is_up
            value += 2
          else
            value -= post.post_number == 1 ? 10 : 5
          end
        end

        post_user.custom_fields["reputation"] = [(post_user.reputation.to_i + value), 1].max
        post_user.save_custom_fields(true)

        obj = {
          rating: post.custom_fields["rating"].to_i
        }

        render json: obj
      else
        return render_json_error(I18n.t("reputation.already_voted"))
      end
    end
  end
end
