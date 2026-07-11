-- Enable accent-insensitive search ("zhukov" matches "Zhúkov").
-- Used by the search and people routes via unaccent().
CREATE EXTENSION IF NOT EXISTS unaccent;
