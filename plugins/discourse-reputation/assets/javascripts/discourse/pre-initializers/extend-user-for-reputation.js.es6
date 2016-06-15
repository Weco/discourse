import property from 'ember-addons/ember-computed-decorators';
import User from 'discourse/models/user';

export default {
    name: 'extend-user-for-reputation',
    before: 'inject-discourse-objects',
    initialize() {
        User.reopen({
            @property('custom_fields.reputation')
            reputation: {
                get(value) {
                    return value;
                },
                set(value) {
                    this.set("custom_fields.reputation", value);

                    return value;
                }
            }
        });
    }
};