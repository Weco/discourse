import { createWidget } from 'discourse/widgets/widget';
import { h } from 'virtual-dom';

export default createWidget('rating-count', {
    tagName: 'div.rating_box__count',
    buildKey: () => 'rating-count',

    buildClasses(attrs, state) {
        if (attrs.rating_count.toString().length > 4) {
            return 'rating_box__count--small';
        }
    },

    html(attrs, state) {
        return attrs.rating_count.toString();
    }
});