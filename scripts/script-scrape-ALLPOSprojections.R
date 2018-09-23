devtools::install_github(repo = "FantasyFootballAnalytics/ffanalytics", build_vignettes = TRUE)
library("ffanalytics")

# would really like to automate this part, but for now...
# these are the variables for the time period to scrape

# only update end, adding 1 to it on Wednesdays, preferably in the evening
season <- 2018
week <- 0
end <- 4 # end should be whatever NFL week it is + 1

# while loop to scrape from beginning to end of season
while (week < end){
  print("Season:")
  print(season)
  print("Week:")
  print(week)
  # proprietary scrape from the guys at FantasyFootballAnalytics.net
  my_scrape <- scrape_data(
                  src = c("CBS", "ESPN", "FantasyData", 
                          "FantasyPros", "FantasySharks", "FFToday", 
                          "FleaFlicker", "NumberFire", "Yahoo", 
                          "FantasyFootballNerd", "NFL"),
                  pos = c("QB", "RB", "WR", "TE", "DST"), 
                  season = season, week = week)

  my_projections <- projections_table(my_scrape)

  my_projections <- my_projections %>% add_ecr() %>% add_risk() %>%
    add_adp() %>% add_aav()

  my_projections <- my_projections %>% add_player_info()

  # creates a file with season and week in the name
  file_name = paste(season, "season-week", week, "-projections.csv", sep = "")
  write.csv(my_projections, file=file.path("/usr/local/src/data", file_name), row.names=FALSE)

  week = week + 1
}



