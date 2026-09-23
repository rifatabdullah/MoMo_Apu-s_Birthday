# Football News & Scores CLI

A Node.js command-line application that fetches the latest football (soccer) and American football (NFL) news from Google News RSS and live scores/fixtures from ESPN.

## Features

- **Interactive Menu Mode**: Run with no arguments for an interactive, easy-to-use menu.
- **Direct Command Mode**: Run single commands for quick access (e.g. `node index.js scores pl`).
- **Google News RSS Integration**: Fetches relevant articles using customizable search queries.
- **ESPN Scores Integration**: Displays colorized, formatted tables of matches, scores, and status/times for multiple global leagues:
  - English Premier League (`pl`)
  - Spanish La Liga (`laliga`)
  - Italian Serie A (`seriea`)
  - German Bundesliga (`bundesliga`)
  - French Ligue 1 (`ligue1`)
  - UEFA Champions League (`cl`)
  - Major League Soccer (`mls`)
  - NFL American Football (`nfl`)

## Prerequisites

Ensure you have **Node.js** installed (v18 or higher recommended).

## Installation

1. Navigate to the project directory:
   ```bash
   cd "H:\Google Agent"
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## How to Run

### 1. Interactive Menu
To open the interactive selection menu:
```bash
node index.js
```

### 2. Direct Commands
To immediately query news or scores:

- **Get News**:
  ```bash
  node index.js news "<query>"
  # Examples:
  node index.js news "Liverpool FC"
  node index.js news "Champions League"
  node index.js news "NFL draft"
  ```

- **Get Scores**:
  ```bash
  node index.js scores <league>
  # Examples:
  node index.js scores pl      # Premier League
  node index.js scores nfl     # NFL
  node index.js scores laliga  # La Liga
  ```

- **Help Menu**:
  ```bash
  node index.js help
  ```
