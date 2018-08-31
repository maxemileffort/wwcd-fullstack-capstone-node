devtools::install_github(repo = "FantasyFootballAnalytics/ffanalytics", build_vignettes = TRUE)
library("ffanalytics")

# would really like to automate this part, but for now...
# these are the variables for the time period to scrape
season <- 2018
week <- 0
end<- 1

# while loop to scrape from beginning to end of season
while (week < end){
    print("Season:")
    print(season)
    print("Week:")
    print(week)
    print("End:")
    print(end)
    # proprietary scrape from the guys at FantasyFootballAnalytics.net
    my_scrape <- scrape_data(src = c("CBS", "ESPN", "Yahoo"),
                        pos = c("QB", "RB", "WR", "TE", "K", "DST"), 
                        season = season, week = week)
    
    # want to check my_scrape to make sure it's not empty
    if (my_scrape != ''){
        my_projections <- projections_table(my_scrape)

        my_projections <- my_projections %>% add_ecr() %>% add_risk() %>%
                    add_adp() %>% add_aav()

        my_projections <- my_projections %>% add_player_info()

        # creates a file with season and week in the name
        file_name = paste(season, "season-week", week, "-projections.csv", sep = "")
        write.csv(my_projections, file=file.path("/usr/local/src/data", file_name), row.names=FALSE)

        week = week +1
        my_scrape <- ''

    # if it is emppty, then that means we aren't to those weeks yet...
    # so just finish the script real fast
    } else {

        week = week + 1

    }

    
}

