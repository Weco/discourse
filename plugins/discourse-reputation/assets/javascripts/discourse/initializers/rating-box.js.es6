import { withPluginApi } from 'discourse/lib/plugin-api';

export default {
    name: "vote-box",
    initialize() {
        withPluginApi('0.1', api => {
            const topicController = api.container.lookup('controller:topic');

            topicController.addObserver('editingTopic', null, () => {
                // Update has_rating flag in each post after editing of topic
                if (!topicController.get('editingTopic')) {
                    const tags = topicController.get('model.tags') || [];
                    const posts = topicController.get('model.postStream.posts');
                    const hasRating = tags.indexOf('problem') !== -1;

                    posts.forEach(post => post.set('has_rating', hasRating));
                }
            });

            api.includePostAttributes('has_rating', 'rating');
        });
    }
};
