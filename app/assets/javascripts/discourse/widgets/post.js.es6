import PostCooked from 'discourse/widgets/post-cooked';
import DecoratorHelper from 'discourse/widgets/decorator-helper';
import { createWidget, applyDecorators } from 'discourse/widgets/widget';
import { iconNode } from 'discourse/helpers/fa-icon';
import transformPost from 'discourse/lib/transform-post';
import { transformBasicPost } from 'discourse/lib/transform-post';
import { h } from 'virtual-dom';
import DiscourseURL from 'discourse/lib/url';
import { dateNode } from 'discourse/helpers/node';
import { translateSize, avatarUrl } from 'discourse/lib/utilities';

export function avatarImg(wanted, attrs) {
  const size = translateSize(wanted);
  const url = avatarUrl(attrs.template, size);

  // We won't render an invalid url
  if (!url || url.length === 0) { return; }
  const title = attrs.username;

  const properties = {
    attributes: { alt: '', width: size, height: size, src: Discourse.getURLWithCDN(url), title },
    className: 'avatar'
  };

  return h('img', properties);
}

export function avatarFor(wanted, attrs) {
  return h('a', {
    className: `trigger-user-card ${attrs.className || ''}`,
    attributes: { href: attrs.url, 'data-user-card': attrs.username }
  }, avatarImg(wanted, attrs));
}

createWidget('select-post', {
  tagName: 'div.select-posts',

  html(attrs) {
    const buttons = [];

    if (attrs.replyCount > 0 && !attrs.selected) {
      buttons.push(this.attach('button', { label: 'topic.multi_select.select_replies', action: 'selectReplies' }));
    }

    const selectPostKey = attrs.selected ? 'topic.multi_select.selected' : 'topic.multi_select.select';
    buttons.push(this.attach('button', { className: 'select-post',
                                         label: selectPostKey,
                                         labelOptions: { count: attrs.selectedPostsCount },
                                         action: 'selectPost' }));
    return buttons;
  }
});

createWidget('reply-to-tab', {
  tagName: 'a.reply-to-tab',
  buildKey: attrs => `reply-to-tab-${attrs.id}`,

  defaultState() {
    return { loading: false };
  },

  html(attrs, state) {
    if (state.loading) { return I18n.t('loading'); }

    return [iconNode('mail-forward'),
            ' ',
            avatarImg('small', {
              template: attrs.replyToAvatarTemplate,
              username: attrs.replyToUsername
            }),
            ' ',
            h('span', attrs.replyToUsername)];
  },

  click() {
    this.state.loading = true;
    this.sendWidgetAction('toggleReplyAbove').then(() => this.state.loading = false);
  }
});

createWidget('post-avatar', {
  tagName: 'div.topic-avatar',

  settings: {
    size: 'large'
  },

  html(attrs) {
    let body;
    if (!attrs.user_id) {
      body = h('i', { className: 'fa fa-trash-o deleted-user-avatar' });
    } else {
      body = avatarFor.call(this, this.settings.size, {
        template: attrs.avatar_template,
        username: attrs.username,
        url: attrs.usernameUrl,
        className: 'main-avatar'
      });
    }

    return [body, h('div.poster-avatar-extra')];
  }
});


createWidget('wiki-edit-button', {
  tagName: 'div.post-info.wiki',
  title: 'post.wiki.about',

  html() {
    return iconNode('pencil-square-o');
  },

  click() {
    this.sendWidgetAction('editPost');
  }
});

createWidget('post-email-indicator', {
  tagName: 'div.post-info.via-email',

  title(attrs) {
    return attrs.isAutoGenerated ?
            I18n.t('post.via_auto_generated_email') :
            I18n.t('post.via_email');
  },

  buildClasses(attrs) {
    return attrs.canViewRawEmail ? 'raw-email' : null;
  },

  html(attrs) {
    return attrs.isAutoGenerated ? iconNode('envelope') : iconNode('envelope-o');
  },

  click() {
    if (this.attrs.canViewRawEmail) {
      this.sendWidgetAction('showRawEmail');
    }
  }
});

function showReplyTab(attrs, siteSettings) {
  return attrs.replyToUsername &&
         (!attrs.replyDirectlyAbove || !siteSettings.suppress_reply_directly_above);
}

createWidget('post-date', {
  tagName: 'div.post-info',
  html(attrs) {
    const createdAt = new Date(attrs.created_at);

    if (createdAt) {
      return h('a.post-date', {
        attributes: {
          href: attrs.shareUrl,
          'data-share-url': attrs.shareUrl,
          'data-post-number': attrs.post_number
        }
      }, [attrs.prefix, dateNode(createdAt)]);
    }
  }
})

createWidget('post-meta-data', {
  tagName: 'div.topic-meta-data',
  html(attrs, state) {
    let result = [];

    if (attrs.isWhisper) {
      result.push(h('div.post-info.whisper', {
        attributes: { title: I18n.t('post.whisper') },
      }, iconNode('eye-slash')));
    }

    if (attrs.created_at) {
      result.push(this.attach('post-date', Object.assign({ prefix: 'Created ' }, attrs)));
    }

    if (attrs.via_email) {
      result.push(this.attach('post-email-indicator', attrs));
    }

    if (attrs.version > 1) {
      result.push(this.attach('post-edits-indicator', attrs));
    }

    if (attrs.wiki) {
      result.push(this.attach('wiki-edit-button', attrs));
    }

    if (attrs.multiSelect) {
      result.push(this.attach('select-post', attrs));
    }

    result.push(h('div.read-state', {
      className: attrs.read ? 'read' : null,
      attributes: {
        title: I18n.t('post.unread')
      }
    }, iconNode('circle')));

    return result;
  }
});

createWidget('expand-hidden', {
  tagName: 'a.expand-hidden',

  html() {
    return I18n.t('post.show_hidden');
  },

  click() {
    this.sendWidgetAction('expandHidden');
  }
});

createWidget('expand-post-button', {
  tagName: 'button.btn.expand-post',
  buildKey: attrs => `expand-post-button-${attrs.id}`,

  defaultState() {
    return { loadingExpanded: false };
  },

  html(attrs, state) {
    if (state.loadingExpanded) {
      return I18n.t('loading');
    } else {
      return [I18n.t('post.show_full'), "..."];
    }
  },

  click() {
    this.state.loadingExpanded = true;
    this.sendWidgetAction('expandFirstPost');
  }
});

createWidget('post-contents', {
  buildKey: attrs => `post-contents-${attrs.id}`,

  defaultState() {
    return { expandedFirstPost: false, repliesBelow: [] };
  },

  buildClasses(attrs) {
    const classes = ['regular'];
    if (!this.state.repliesShown) {
      classes.push('contents');
    }
    if (showReplyTab(attrs, this.siteSettings)) {
      classes.push('avoid-tab');
    }
    return classes;
  },

  html(attrs, state) {
    let result = [new PostCooked(attrs, new DecoratorHelper(this))];
    result = result.concat(applyDecorators(this, 'after-cooked', attrs, state));

    if (attrs.cooked_hidden) {
      result.push(this.attach('expand-hidden', attrs));
    }

    if (!state.expandedFirstPost && attrs.expandablePost) {
      result.push(this.attach('expand-post-button', attrs));
    }

    return result;
  },

  toggleRepliesBelow() {
    if (this.state.repliesBelow.length) {
      this.state.repliesBelow = [];
      return;
    }

    const post = this.findAncestorModel();
    const topicUrl = post ? post.get('topic.url') : null;
    return this.store.find('post-reply', { postId: this.attrs.id }).then(posts => {
      this.state.repliesBelow = posts.map(p => {
        p.shareUrl = `${topicUrl}/${p.post_number}`;
        return transformBasicPost(p);
      });
    });
  },

  expandFirstPost() {
    const post = this.findAncestorModel();
    return post.expand().then(() => this.state.expandedFirstPost = true);
  }
});

createWidget('post-body', {
  buildKey: attrs => `post-body-${attrs.id}`,
  tagName: 'div.topic-body.clearfix',

  defaultState() {
    return { showComments: false };
  },

  html(attrs, state) {
    const result = [
      h('div.post-author', [this.attach('post-avatar', attrs), this.attach('poster-name', attrs)]),
      this.attach('post-contents', attrs),
      this.attach('post-meta-data', attrs),
      this.attach('post-menu', attrs)
    ];
    const post = this.findAncestorModel();
    const replies = post.get('replies');

    if (!Ember.isEmpty(replies) && state.showComments) {
      result.push(h('section.embedded-posts.bottom.clearfix',
        replies
          .map(model => {
            const transformed = transformPost(this.currentUser, this.site, model);

            transformed.canCreatePost = attrs.canCreatePost;
            transformed.mobileView = attrs.mobileView;

            return this.attach('embedded-post', transformed, { model });
          })
          .concat(attrs.canCreatePost ? this.attach('button', {
            action: 'replyToPost',
            title: 'post.comments.one',
            className: 'reply create btn btn-primary btn-small',
            label: !attrs.mobileView && 'post.comments.one',
            icon: attrs.mobileView && 'reply'
          }) : [])
      ));
    }

    result.push(this.attach('actions-summary', attrs));
    result.push(this.attach('post-links', attrs));

    if (attrs.post_number === 1 && attrs.has_rating) {
      const solutionsCount = post.get('topic.posts_count') - post.get('topic.reply_count') - 1;

      if (solutionsCount && solutionsCount > 0) {
        result.push(h('div.solutions-count', `${solutionsCount} Solution${solutionsCount === 1 ? '' : 's'}`));
      }
    }

    return result;
  },

  toggleComments() {
    return this.state.showComments = !this.state.showComments;
  }
});

createWidget('post-article', {
  tagName: 'article.boxed.onscreen-post',
  buildKey: attrs => `post-article-${attrs.id}`,

  defaultState() {
    return { repliesAbove: [] };
  },

  buildId(attrs) {
    return `post_${attrs.post_number}`;
  },

  buildClasses(attrs) {
    let classNames = [];
    if (attrs.via_email) { classNames.push('via-email'); }
    if (attrs.isAutoGenerated) { classNames.push('is-auto-generated'); }
    return classNames;
  },

  buildAttributes(attrs) {
    return { 'data-post-id': attrs.id, 'data-user-id': attrs.user_id };
  },

  html(attrs, state) {
    const rows = [h('a.tabLoc', { attributes: { href: ''} })];
    if (state.repliesAbove.length) {
      const replies = state.repliesAbove.map(p => this.attach('embedded-post', p, { state: { above: true } }));
      rows.push(h('div.row', h('section.embedded-posts.top.topic-body.offset2', replies)));
    }

    rows.push(h('div.row', [this.attach('post-body', attrs)]));
    return rows;
  },

  _getTopicUrl() {
    const post = this.findAncestorModel();
    return post ? post.get('topic.url') : null;
  },

  toggleReplyAbove() {
    const replyPostNumber = this.attrs.reply_to_post_number;

    // jump directly on mobile
    if (this.attrs.mobileView) {
      const topicUrl = this._getTopicUrl();
      if (topicUrl) {
        DiscourseURL.routeTo(`${topicUrl}/${replyPostNumber}`);
      }
      return Ember.RSVP.Promise.resolve();
    }

    if (this.state.repliesAbove.length) {
      this.state.repliesAbove = [];
      return Ember.RSVP.Promise.resolve();
    } else {
      const topicUrl = this._getTopicUrl();
      return this.store.find('post-reply-history', { postId: this.attrs.id }).then(posts => {
        this.state.repliesAbove = posts.map((p) => {
          p.shareUrl = `${topicUrl}/${p.post_number}`;
          return transformBasicPost(p);
        });
      });
    }
  },

});

export default createWidget('post', {
  buildKey: attrs => `post-${attrs.id}`,
  shadowTree: true,

  buildAttributes(attrs) {
    return attrs.height ? { style: `min-height: ${attrs.height}px` } : undefined;
  },

  buildId(attrs) {
    return attrs.cloaked ? `post_${attrs.post_number}` : undefined;
  },

  buildClasses(attrs) {
    if (attrs.cloaked) { return 'cloaked-post'; }
    const classNames = ['topic-post', 'clearfix'];

    if (attrs.selected) { classNames.push('selected'); }
    if (attrs.topicOwner) { classNames.push('topic-owner'); }
    if (attrs.hidden) { classNames.push('post-hidden'); }
    if (attrs.deleted) { classNames.push('deleted'); }
    if (attrs.primary_group_name) { classNames.push(`group-${attrs.primary_group_name}`); }
    if (attrs.wiki) { classNames.push(`wiki`); }
    if (attrs.isWhisper) { classNames.push('whisper'); }
    if (attrs.has_rating) { classNames.push('rating'); }
    if (attrs.replyCount === 0) { classNames.push('no-replies'); }
    if (attrs.isModeratorAction || (attrs.isWarning && attrs.firstPost)) {
      classNames.push('moderator');
    } else {
      classNames.push('regular');
    }
    return classNames;
  },

  html(attrs) {
    if (attrs.cloaked) { return ''; }

    return this.attach('post-article', attrs);
  },

  toggleLike() {
    const post = this.model;
    const likeAction = post.get('likeAction');

    if (likeAction && likeAction.get('canToggle')) {
      return likeAction.togglePromise(post).then(result => this._warnIfClose(result));
    }
  },

  _warnIfClose(result) {
    if (!result || !result.acted) { return; }

    const kvs = this.keyValueStore;
    const lastWarnedLikes = kvs.get('lastWarnedLikes');

    // only warn once per day
    const yesterday = new Date().getTime() - 1000 * 60 * 60 * 24;
    if (lastWarnedLikes && parseInt(lastWarnedLikes) > yesterday) {
      return;
    }

    const { remaining, max } = result;
    const threshold = Math.ceil(max * 0.1);
    if (remaining === threshold) {
      bootbox.alert(I18n.t('post.few_likes_left'));
      kvs.set({ key: 'lastWarnedLikes', value: new Date().getTime() });
    }
  },

  undoPostAction(typeId) {
    const post = this.model;
    return post.get('actions_summary').findProperty('id', typeId).undo(post);
  },

  deferPostActionFlags(typeId) {
    const post = this.model;
    return post.get('actions_summary').findProperty('id', typeId).deferFlags(post);
  }
});
