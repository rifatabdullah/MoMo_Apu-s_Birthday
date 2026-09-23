#!/usr/bin/env node

const Parser = require('rss-parser');
const pc = require('picocolors');
const Table = require('cli-table3');
const ora = require('ora');
const readline = require('readline');

const parser = new Parser();

// Map of friendly league slugs to ESPN API endpoints
const LEAGUES = {
  // Soccer
  'pl': { name: 'English Premier League', endpoint: 'soccer/eng.1' },
  'premier-league': { name: 'English Premier League', endpoint: 'soccer/eng.1' },
  'laliga': { name: 'Spanish La Liga', endpoint: 'soccer/esp.1' },
  'la-liga': { name: 'Spanish La Liga', endpoint: 'soccer/esp.1' },
  'seriea': { name: 'Italian Serie A', endpoint: 'soccer/ita.1' },
  'serie-a': { name: 'Italian Serie A', endpoint: 'soccer/ita.1' },
  'bundesliga': { name: 'German Bundesliga', endpoint: 'soccer/ger.1' },
  'ligue1': { name: 'French Ligue 1', endpoint: 'soccer/fra.1' },
  'ligue-1': { name: 'French Ligue 1', endpoint: 'soccer/fra.1' },
  'cl': { name: 'UEFA Champions League', endpoint: 'soccer/uefa.champions' },
  'champions-league': { name: 'UEFA Champions League', endpoint: 'soccer/uefa.champions' },
  'mls': { name: 'Major League Soccer', endpoint: 'soccer/usa.1' },
  
  // American Football
  'nfl': { name: 'NFL', endpoint: 'football/nfl' }
};

// Help message
const helpMessage = `
${pc.bold(pc.cyan('Football News & Scores CLI'))}

${pc.bold('Usage:')}
  ${pc.green('node index.js')}                  - Open the interactive menu
  ${pc.green('node index.js news <query>')}      - Get football news from Google for a query
  ${pc.green('node index.js scores <league>')}   - Get football scores for a league (e.g. pl, nfl, laliga)
  ${pc.green('node index.js help')}              - Show this help message

${pc.bold('Supported Leagues for Scores:')}
  ${pc.yellow('pl / premier-league')}   - English Premier League (Soccer)
  ${pc.yellow('laliga / la-liga')}       - Spanish La Liga (Soccer)
  ${pc.yellow('seriea / serie-a')}       - Italian Serie A (Soccer)
  ${pc.yellow('bundesliga')}             - German Bundesliga (Soccer)
  ${pc.yellow('ligue1 / ligue-1')}       - French Ligue 1 (Soccer)
  ${pc.yellow('cl / champions-league')}  - UEFA Champions League (Soccer)
  ${pc.yellow('mls')}                    - Major League Soccer (Soccer)
  ${pc.yellow('nfl')}                    - NFL (American Football)
`;

// Helper to fetch news from Google News RSS
async function fetchNews(query) {
  const spinner = ora(`Fetching news for "${query}" from Google News...`).start();
  try {
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
    const feed = await parser.parseURL(url);
    spinner.succeed(pc.green(`Fetched ${feed.items.length} articles.`));

    console.log('\n' + pc.bold(pc.cyan(`=== NEWS: ${query.toUpperCase()} ===`)) + '\n');
    feed.items.slice(0, 10).forEach((item, index) => {
      const date = new Date(item.pubDate).toLocaleDateString();
      console.log(`${pc.bold(pc.yellow(index + 1 + '.'))} ${pc.bold(item.title)}`);
      console.log(`   ${pc.dim('Source:')} ${pc.magenta(item.source?.name || 'Unknown')} | ${pc.dim('Date:')} ${pc.gray(date)}`);
      console.log(`   ${pc.dim('Link:')} ${pc.blue(item.link)}\n`);
    });
  } catch (error) {
    spinner.fail(pc.red('Failed to fetch news.'));
    console.error(pc.red(error.message));
  }
}

// Helper to fetch scores from ESPN API
async function fetchScores(leagueKey) {
  const league = LEAGUES[leagueKey.toLowerCase()];
  if (!league) {
    console.log(pc.red(`\nUnknown league: "${leagueKey}"`));
    console.log(`Use one of: ${Object.keys(LEAGUES).join(', ')}`);
    return;
  }

  const spinner = ora(`Fetching scores for ${league.name}...`).start();
  try {
    const url = `https://site.api.espn.com/apis/site/v2/sports/${league.endpoint}/scoreboard`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    spinner.succeed(pc.green(`Fetched scores for ${league.name}.`));

    const events = data.events || [];
    if (events.length === 0) {
      console.log(pc.yellow('\nNo match events found currently.'));
      return;
    }

    console.log('\n' + pc.bold(pc.cyan(`=== SCORES: ${league.name.toUpperCase()} ===`)) + '\n');

    const table = new Table({
      head: [pc.bold('Home Team'), pc.bold('Score'), pc.bold('Away Team'), pc.bold('Status / Time')],
      colWidths: [30, 15, 30, 25]
    });

    events.forEach(event => {
      const status = event.status?.type?.detail || 'Unknown';
      const isLive = event.status?.type?.state === 'in';
      const isCompleted = event.status?.type?.state === 'post';
      
      const competitors = event.competitions?.[0]?.competitors || [];
      const homeTeamObj = competitors.find(c => c.homeAway === 'home');
      const awayTeamObj = competitors.find(c => c.homeAway === 'away');

      if (!homeTeamObj || !awayTeamObj) return;

      const homeName = homeTeamObj.team?.displayName || 'Unknown';
      const awayName = awayTeamObj.team?.displayName || 'Unknown';
      
      const homeScore = homeTeamObj.score || '0';
      const awayScore = awayTeamObj.score || '0';

      let statusStyled = status;
      if (isLive) {
        statusStyled = pc.bold(pc.red(`● LIVE - ${status}`));
      } else if (isCompleted) {
        statusStyled = pc.green(status);
      } else {
        statusStyled = pc.gray(status);
      }

      // Highlight winner if completed
      let homeStyled = homeName;
      let awayStyled = awayName;
      let scoreStyled = `${homeScore} - ${awayScore}`;

      if (isCompleted) {
        const homeScoreNum = parseInt(homeScore);
        const awayScoreNum = parseInt(awayScore);
        if (homeScoreNum > awayScoreNum) {
          homeStyled = pc.bold(pc.green(homeName));
        } else if (awayScoreNum > homeScoreNum) {
          awayStyled = pc.bold(pc.green(awayName));
        }
      } else if (isLive) {
        homeStyled = pc.bold(homeName);
        awayStyled = pc.bold(awayName);
        scoreStyled = pc.bold(pc.yellow(`${homeScore} - ${awayScore}`));
      }

      table.push([
        homeStyled,
        { hAlign: 'center', content: scoreStyled },
        awayStyled,
        statusStyled
      ]);
    });

    console.log(table.toString());
    console.log(`\n${pc.dim('Scores provided by ESPN.')}\n`);

  } catch (error) {
    spinner.fail(pc.red('Failed to fetch scores.'));
    console.error(pc.red(error.message));
  }
}

// Interactive menu handler
function showInteractiveMenu() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const menu = () => {
    console.log(`
${pc.bold(pc.cyan('========================================'))}
${pc.bold(pc.cyan('      FOOTBALL NEWS & SCORES CLI        '))}
${pc.bold(pc.cyan('========================================'))}
1. Football News (Soccer General)
2. American Football News (NFL General)
3. Custom News Search (e.g. Liverpool FC, Lionel Messi)
4. Premier League Scores (Soccer)
5. La Liga Scores (Soccer)
6. Champions League Scores (Soccer)
7. MLS Scores (Soccer)
8. NFL Scores (American Football)
9. Exit
${pc.bold(pc.cyan('========================================'))}
`);

    rl.question(pc.bold('Choose an option (1-9): '), async (choice) => {
      const trimChoice = choice.trim();
      switch (trimChoice) {
        case '1':
          await fetchNews('soccer news');
          promptBack(menu);
          break;
        case '2':
          await fetchNews('NFL football news');
          promptBack(menu);
          break;
        case '3':
          rl.question('\nEnter your news search query: ', async (query) => {
            if (query.trim()) {
              await fetchNews(query.trim());
            } else {
              console.log(pc.yellow('Query cannot be empty.'));
            }
            promptBack(menu);
          });
          break;
        case '4':
          await fetchScores('pl');
          promptBack(menu);
          break;
        case '5':
          await fetchScores('laliga');
          promptBack(menu);
          break;
        case '6':
          await fetchScores('cl');
          promptBack(menu);
          break;
        case '7':
          await fetchScores('mls');
          promptBack(menu);
          break;
        case '8':
          await fetchScores('nfl');
          promptBack(menu);
          break;
        case '9':
          console.log(pc.cyan('\nGoodbye!\n'));
          rl.close();
          break;
        default:
          console.log(pc.red('\nInvalid choice. Please choose between 1 and 9.'));
          menu();
          break;
      }
    });
  };

  const promptBack = (next) => {
    rl.question(pc.gray('\nPress Enter to return to the menu...'), () => {
      next();
    });
  };

  menu();
}

// Main CLI logic
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    showInteractiveMenu();
    return;
  }

  const cmd = args[0].toLowerCase();
  
  if (cmd === 'help' || cmd === '-h' || cmd === '--help') {
    console.log(helpMessage);
    return;
  }

  if (cmd === 'news') {
    const query = args.slice(1).join(' ');
    if (!query) {
      console.log(pc.red('Error: Please provide a news query.'));
      console.log('Example: node index.js news liverpool');
      return;
    }
    await fetchNews(query);
    return;
  }

  if (cmd === 'scores') {
    const league = args[1];
    if (!league) {
      console.log(pc.red('Error: Please provide a league slug.'));
      console.log('Example: node index.js scores pl');
      return;
    }
    await fetchScores(league);
    return;
  }

  console.log(pc.red(`Unknown command: "${cmd}"`));
  console.log(helpMessage);
}

// Run the application
main();
