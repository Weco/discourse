import PostCooked from 'discourse/widgets/post-cooked';
import DecoratorHelper from 'discourse/widgets/decorator-helper';
import { createWidget } from 'discourse/widgets/widget';
import { h } from 'virtual-dom';
import { iconNode } from 'discourse/helpers/fa-icon';
import DiscourseURL from 'discourse/lib/url';

createWidget('post-link-arrow', {
  html(attrs) {
   if (attrs.above) {
     return h('a.post-info.arrow', {
       attributes: { title: I18n.t('topic.jump_reply_up') }
     }, iconNode('arrow-up'));
   } else {
     return h('a.post-info.arrow', {
       attributes: { title: I18n.t('topic.jump_reply_down') }
     }, iconNode('arrow-down'));
   }
  },

  click() {
    DiscourseURL.routeTo(this.attrs.shareUrl);
  }
});

export default createWidget('embedded-post', {
  tagName: 'div.topic-reply',
  buildKey: attrs => `embedded-post-${attrs.id}`,

  buildAttributes(attrs) {
    return {'data-post-id': attrs.id}
  },

  html(attrs, state) {
    const menu = [this.attach('post-menu', attrs, {
      state: { collapsed: false }
    })];
    const body = [
      this.attach('post-avatar', attrs),
      this.attach('poster-name', attrs),
    ];

    if (attrs.created_at) {
      menu.push(this.attach('post-date', attrs));
    }

    if (attrs.isBetterSolution) {
      body.push(h('span.better-solution', I18n.t('composer.better_solution')));
    }

    body.push.apply(body, [new PostCooked(attrs, new DecoratorHelper(this)), menu]);

    return h('div.row', [
      h('div.topic-body', body)
    ]);
  }
});
