class CleanUpOfCustomFields < ActiveRecord::Migration

  def up
    PostCustomField.where(name: "votes").find_each do |pcf|
      begin
        ::JSON.parse(pcf.value)
      rescue TypeError, JSON::ParserError => e
        pcf.value = {}.to_s
        pcf.save
      end
    end
  end

  def down
  end

end
