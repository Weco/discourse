class TopicListItemSerializer < SearchTopicSerializer

  has_one :first_post, serializmer: PostSerializer, embed: :objects
  has_one :best_solution_post, serializer: PostSerializer, embed: :objects

end
