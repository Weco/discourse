import PostCooked from 'discourse/widgets/post-cooked';
import DecoratorHelper from 'discourse/widgets/decorator-helper';
import { createWidget, applyDecorators } from 'discourse/widgets/widget';
import { h } from 'virtual-dom';
import DiscourseURL from 'discourse/lib/url';

createWidget('topic-list-item-menu', {
  tagName: 'section.post-menu-area.clearfix',
  buildKey: attrs => `topic-list-item-menu-${attrs.id}`,

  html(attrs, state) {
    const post = this.findAncestorModel();
    const buttons = [];

    if (attrs.canCreatePost) {
      const args = {
        action: 'replyToPost',
        title: 'post.controls.reply',
        className: 'reply create btn'
      };

      if (!attrs.mobileView) {
        args.label = `topic.${attrs.has_rating ? (attrs.post_number == 1 ? 'add_solution' : 'add_comment') : 'reply'}.title`;
      } else {
        args.icon = 'reply';
      }

      buttons.push(this.attach('button', args));
    }

    if (attrs.has_rating) {
      buttons.push(this.attach('rating-box', attrs));

      if (attrs.post_number === 1) {
        const solutionsCount = post.get('topic.posts_count') - post.get('topic.reply_count') - 1;

        if (solutionsCount && solutionsCount > 0) {
          buttons.push(this.attach('button', {
            action: 'goToTopic',
            className: 'solutions text',
            label: 'post.controls.solution',
            labelOptions: { count: solutionsCount }
          }));
        }
      }
    }

    buttons.push(this.attach('post-date', Object.assign({ prefix: 'Created ' }, attrs)));

    return h('nav.post-controls.clearfix', [
      h('div.actions', buttons)
    ]);
  }
});


createWidget('topic-list-item-contents-expand', {
  tagName: 'span.more',

  html() {
    return 'show more';
  },

  click() {
    this.sendWidgetAction('expandContent');
  }
});

createWidget('topic-list-item-contents', {
  buildKey: attrs => `topic-list-item-contents-${attrs.id}`,

  defaultState(attrs) {
    return { expanded: true };
  },

  buildClasses(attrs) {
    return ['regular', 'contents'].concat(this.state.expanded ? ['full'] : []);
  },

  html(attrs, state) {
    const result = [new PostCooked(attrs, new DecoratorHelper(this))];

    result.push(applyDecorators(this, 'after-cooked', attrs, state));

    // if (!this.state.expanded) {
    //   result.push(this.attach('topic-list-item-contents-expand', attrs));
    // }

    return result;
  },

  expandContent() {
    this.state.expanded = true;
  }
});

export default createWidget('topic-list-item', {
  buildKey: attrs => `topic-list-item-${attrs.id}`,
  shadowTree: true,

  buildClasses(attrs) {
    const classNames = ['topic-post', 'clearfix'];

    if (attrs.has_rating) { classNames.push('rating'); }
    if (attrs.replyCount === 0) { classNames.push('no-replies'); }

    return classNames;
  },

  html(attrs) {
    return h('article.boxed.onscreen-post', [
      h('a.tabLoc', { attributes: { href: ''} }),
      h('div.row', [
        h('div.topic-body.clearfix', [
          h('div.post-author', [this.attach('post-avatar', attrs), this.attach('poster-name', attrs)]),
          this.attach('topic-list-item-contents', attrs),
          this.attach('topic-list-item-menu', attrs)
        ])
      ])
    ]);
  },

  goToTopic() {
    const post = this.findAncestorModel();
    const topicUrl = post ? post.get('topic.url') : null;

    if (topicUrl) {
      DiscourseURL.routeTo(topicUrl);
    }
  }
});
