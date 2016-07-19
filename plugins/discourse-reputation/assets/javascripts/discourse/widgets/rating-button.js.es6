import { createWidget } from 'discourse/widgets/widget';
import { h } from 'virtual-dom';
import showModal from 'discourse/lib/show-modal';

export default createWidget('rating-button', {
    tagName: 'button.widget-button.rating',

    buildClasses(attrs) {
        if (attrs.isReply) {
            return `text${attrs.type === 'up' ? ' counter' : ''}`;
        } else {
            return attrs.type === 'up' ? 'btn' : 'text';
        }
    },

    html(attrs) {
        if (attrs.type === 'up') {
            const rating = attrs.rating.toString();

            if (attrs.isReply) {
                return [h('span.text', 'Upvote'), h('span.counter', rating)];
            } else {
                return ['Upvote', h('span.divider'), rating];
            }

            return result;
        } else {
            return 'Downvote';
        }
    },

    click() {
        if (!this.currentUser) {
            showModal('login');
        }

        this.sendWidgetAction('rate', this.attrs.type);
    }
});