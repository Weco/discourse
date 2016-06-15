import { createWidget } from 'discourse/widgets/widget';
import { h } from 'virtual-dom';

export default createWidget('rating-box', {
    tagName: 'div.rating_box',
    buildKey: () => 'rating-box',

    defaultState() {
        return {
            allowClick: true
        };
    },

    html(attrs, state) {
        const rateUpButton = this.attach('rating-button', { type: 'up' });
        const ratingCount = this.attach('rating-count', attrs);
        const rateDownButton = this.attach('rating-button', { type: 'down' });

        return [rateUpButton, ratingCount, rateDownButton];
    },

    rate(type) {
        const state = this.state;

        if (!state.allowClick) {
            return false;
        }

        state.allowClick = false;

        return Discourse.ajax(`/rating/${type}`, {
            type: 'POST',
            data: { post_id: this.attrs.id }
        })
        .then(result => {
            const topicController = this.container.lookup('controller:topic');
            const post = topicController && topicController.get('model.postStream.posts').findBy('id', this.attrs.id);

            if (post) {
                post.set('rating', result.rating);
            }
        })
        .catch(error => {
            let message;

            try {
                message = error.jqXHR.responseJSON.errors[0];
            } catch (e) {}

            message && bootbox.alert(message);
        })
        .finally(() => state.allowClick = true);
    }
});