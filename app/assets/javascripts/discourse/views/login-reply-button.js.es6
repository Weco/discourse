import ButtonView from 'discourse/views/button';

export default ButtonView.extend({
  text: function() {
    const tags = this.get('controller').model.tags;
    const isProblem = tags.indexOf('problem') !== -1;

    return I18n.t(`topic.${isProblem ? 'add_solution' : 'reply'}.title`);
  }.property(),
  classNames: ['btn', 'btn-primary', 'create'],
  click: function() {
    this.get('controller').send('showLogin');
  },
  renderIcon: function(buffer) {
    buffer.push("<i class='fa fa-reply'></i>");
  }
});
