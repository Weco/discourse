import { registerUnbound } from 'discourse/lib/helpers';
import { autoUpdatingRelativeAge, longDate } from 'discourse/lib/formatter';

/**
  Display logic for dates. It is unbound in Ember but will use jQuery to
  update the dates on a regular interval.
**/
registerUnbound('format-date', function(val, params) {
  var leaveAgo,
      format = 'medium',
      title = true;

  if (params.leaveAgo) {
    leaveAgo = params.leaveAgo === "true";
  }
  if (params.format) {
    format = params.format;
  }
  if (params.noTitle) {
    title = false;
  }

  if (val) {
    var date = new Date(val);

    if (params.absoluteDate == 'true') {
      return new Handlebars.SafeString(longDate(date));
    } else {
      return new Handlebars.SafeString(autoUpdatingRelativeAge(date, {format: format, title: title, leaveAgo: leaveAgo}));
    }
  }
});


