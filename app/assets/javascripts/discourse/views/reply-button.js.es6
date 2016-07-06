import ButtonView from 'discourse/views/button';

export default ButtonView.extend({
  classNames: ['btn', 'btn-primary', 'create'],
  helpKey: 'topic.reply.help',

  text: function() {
    var archetypeCapitalized = this.get('controller.content.archetype').capitalize();
    var customTitle = this.get("parentView.replyButtonText" + archetypeCapitalized);
    if (customTitle) { return customTitle; }

    const tags = this.get('controller').model.tags;
    const isProblem = tags.indexOf('problem') !== -1;

    return I18n.t(`topic.${isProblem ? 'add_solution' : 'reply'}.title`);
  }.property(),

  renderIcon: function(buffer) {
    buffer.push("<i class='fa fa-reply'></i>");
  },

  click: function() {
    this.get('controller').send('replyToPost');
  }
});

