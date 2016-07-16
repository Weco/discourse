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
        const rateUpButton = this.attach('rating-button', {
            type: 'up',
            rating: attrs.rating
        });
        const rateDownButton = this.attach('rating-button', { type: 'down' });

        return [rateUpButton, rateDownButton];
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
            const post = this.findAncestorModel();

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