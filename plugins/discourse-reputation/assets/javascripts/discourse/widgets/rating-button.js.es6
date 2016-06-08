import { createWidget } from 'discourse/widgets/widget';
import { h } from 'virtual-dom';
import showModal from 'discourse/lib/show-modal';

export default createWidget('rating-button', {
    tagName: 'div.rating_box__button',

    buildClasses(attrs) {
        return `rating_box__button--${attrs.type}`;
    },

    click() {
        if (!this.currentUser) {
            showModal('login');
        }

        this.sendWidgetAction('rate', this.attrs.type);
    }
});