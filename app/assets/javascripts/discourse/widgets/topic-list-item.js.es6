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
    const isFirst = attrs.post_number === 1;

    if (isFirst && attrs.canCreatePost) {
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
    }

    if (isFirst) {
      const repliesCount = post.get('topic.posts_count') - post.get('topic.reply_count') - 1;

      if (repliesCount && repliesCount > 0) {
        buttons.push(this.attach('button', {
          action: 'goToTopic',
          className: 'solutions text',
          label: `post.controls.${attrs.has_rating ? 'solutions' : 'replies'}`,
          counter: repliesCount
        }));
      }
    }

    buttons.push(this.attach('post-date', Object.assign({ prefix: 'Created ' }, attrs)));

    return h('nav.post-controls.clearfix', [
      h('div.actions', buttons)
    ]);
  }
});


createWidget('topic-list-item-contents-expand', {
  tagName: 'a.more',

  html() {
    return '(more)';
  },

  click(event) {
    this.sendWidgetAction('expandContent');
    event.preventDefault();
  }
});

createWidget('topic-list-item-contents', {
  buildKey: attrs => `topic-list-item-contents-${attrs.id}`,

  maxLength: 250,

  defaultState(attrs) {
    return { expanded: attrs.cooked.length < (this.maxLength + 50) };
  },

  buildClasses(attrs) {
    return ['regular', 'contents'].concat(this.state.expanded ? ['full'] : []);
  },

  html(attrs, state) {
    const cookedAttrs = Object.assign({}, attrs, {
      cooked: this.state.expanded ? attrs.cooked : this.getPreview(attrs.cooked)
    });
    const result = [new PostCooked(cookedAttrs, new DecoratorHelper(this))];

    result.push(applyDecorators(this, 'after-cooked', cookedAttrs, state));

    if (!this.state.expanded) {
      result.push(this.attach('topic-list-item-contents-expand', attrs));
    }

    return result;
  },

  getPreview(html) {
    const div = document.createElement("div");
    let totalLength = 0;
    let isOverflow = false;
    const parse = node => {
      [].slice.call(node.childNodes).forEach(child => {
        if (isOverflow) {
          node.removeChild(child);
        } else {
          if (child.childNodes.length) {
            parse(child);
          } else {
            const text = child.textContent;

            if (totalLength + text.length > this.maxLength) {
              child.textContent = text.substr(0, this.maxLength - totalLength) + '...';
              isOverflow = true;
            } else {
              totalLength += text.length;
            }
          }
        }
      });
    }

    div.innerHTML = html;

    parse(div);

    return div.innerHTML;
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
    attrs.rating = this.findAncestorModel().get('rating');

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

  replyToPost() {
    return this.container.lookup('controller:topic').send('replyToPost', this.model);
  },

  goToTopic() {
    const post = this.findAncestorModel();
    const topicUrl = post ? post.get('topic.url') : null;

    if (topicUrl) {
      DiscourseURL.routeTo(topicUrl + '/2');
    }
  }
});
