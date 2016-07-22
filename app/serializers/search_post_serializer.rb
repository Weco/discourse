class SearchPostSerializer < PostSerializer

  has_one :topic, serializer: SearchTopicSerializer

  attributes :like_count

  attributes :blurb
  def blurb
    options[:result].blurb(object)
  end
end
