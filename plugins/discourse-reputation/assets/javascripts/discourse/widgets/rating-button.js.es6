import { createWidget } from 'discourse/widgets/widget';
import { h } from 'virtual-dom';
import showModal from 'discourse/lib/show-modal';

export default createWidget('rating-button', {
    tagName: 'button.widget-button.rating',

    buildClasses(attrs) {
        return attrs.type === 'up' ? 'btn' : 'text';
    },

    html(attrs) {
        if (attrs.type === 'up') {
            return ['Upvote', h('span.divider'), attrs.rating.toString()];
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