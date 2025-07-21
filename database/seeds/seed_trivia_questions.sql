-- SEED DATA: Sample Trivia Questions
-- Run this after setting up the main schema to populate with example questions

INSERT INTO trivia_questions (category, question, answers, correct_answer_index, score) VALUES
-- Sports Questions
('Sports', 'What''s the diameter of a basketball hoop in inches?', '["14 inches", "16 inches", "18 inches"]', 2, 10),
('Sports', 'How big is an Olympic sized swimming pool in meters?', '["50m x 30m", "50m x 25m", "60m x 30m"]', 1, 10),
('Sports', 'In professional basketball, how high is the basketball hoop from the ground?', '["10ft", "11ft", "12ft"]', 0, 10),
('Sports', 'The Summer Olympics are held every how many years?', '["2 years", "4 years", "6 years"]', 1, 10),
('Sports', 'What sport is dubbed the ''king of sports''?', '["Hockey", "Football", "Soccer"]', 2, 10),
('Sports', 'In American Football, a touchdown is worth how many points?', '["3 points", "6 points", "9 points"]', 1, 10),
('Sports', 'What is Canada''s national sport?', '["Hockey", "Lacrosse", "Cross country skiing"]', 1, 10),
('Sports', 'How many players are on a baseball team?', '["9 players", "15 players", "20 players"]', 0, 10),

-- Science Questions
('Science', 'This essential gas is important so that we can breathe', '["Oxygen", "Nitrogen", "Helium"]', 0, 10),
('Science', 'What is the nearest planet to the sun?', '["Mars", "Pluto", "Mercury"]', 2, 10),
('Science', 'What is the largest planet in the solar system?', '["Earth", "Saturn", "Jupiter"]', 2, 10),
('Science', 'What is the rarest blood type?', '["O positive", "AB negative", "B negative"]', 1, 10),
('Science', 'On what part of your body would you find the pinna?', '["Ear", "Eye", "Nose"]', 0, 10),
('Science', 'What tissue connects muscles to bones?', '["Tendons", "Fibres", "Ligaments"]', 0, 10),
('Science', 'Sounds travels faster in air than in water', '["True", "False"]', 1, 10),
('Science', 'How long does a human red blood cell survive?', '["10 days", "120 days", "2 years"]', 1, 10),

-- Music Questions  
('Music', 'Who was the very first American Idol winner?', '["Kelly Clarkson", "Ryan Starr", "Hilary Duff"]', 0, 10),
('Music', 'Before Miley Cyrus recorded "Wrecking Ball," it was offered to which singer?', '["Alicia Keys", "Beyoncé", "Leona Lewis"]', 1, 10),
('Music', 'What rock icon was the founder of The Society for the Prevention of Cruelty to Long-haired Men?', '["David Bowie", "Peter Frampton", "Mick Jagger"]', 0, 10),
('Music', 'Eminem''s 8 Mile is named after a road in which city?', '["Chicago", "San Francisco", "Detroit"]', 2, 10),
('Music', 'Who was the first woman ever inducted into the Rock and Roll Hall of Fame?', '["Janice Joplin", "Aretha Franklin", "Pat Benatar"]', 1, 10),
('Music', 'Paul McCartney and John Lennon wrote which Rolling Stones song?', '["I Wanna Be Your Man", "Let''s spend the night together", "Ruby Tuesday"]', 0, 10),
('Music', 'Which classical composer was deaf?', '["Wolfgang Amadeus Mozart", "Ludwig van Beethoven", "Johann Sebastian Bach"]', 1, 10),
('Music', 'What does Lady Gaga affectionately call her fans?', '["Superheroes", "Little Monsters", "Gaga fans"]', 1, 10),

-- Technology Questions
('Technology', 'What does "HTTP" stand for?', '["HyperText Transfer Protocol", "High Tech Transfer Protocol", "HyperText Transport Protocol"]', 0, 10),
('Technology', 'What year was the first iPhone released?', '["2006", "2007", "2008"]', 1, 10),
('Technology', 'What does "CPU" stand for?', '["Central Processing Unit", "Computer Processing Unit", "Core Processing Unit"]', 0, 10),
('Technology', 'Which company developed the Java programming language?', '["Microsoft", "Sun Microsystems", "Apple"]', 1, 10),
('Technology', 'What does "URL" stand for?', '["Universal Resource Locator", "Uniform Resource Locator", "Universal Reference Link"]', 1, 10),
('Technology', 'What is the most popular programming language for web development?', '["Python", "JavaScript", "Java"]', 1, 10),
('Technology', 'What does "AI" stand for?', '["Artificial Intelligence", "Automated Intelligence", "Advanced Intelligence"]', 0, 10),
('Technology', 'Which company created the Android operating system?', '["Apple", "Microsoft", "Google"]', 2, 10);

-- Verify the data was inserted
SELECT category, COUNT(*) as question_count 
FROM trivia_questions 
GROUP BY category 
ORDER BY category;
