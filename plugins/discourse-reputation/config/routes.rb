DiscourseReputation::Engine.routes.draw do
	post '/up' => 'rating#up'
	post '/down' => 'rating#down'
end
