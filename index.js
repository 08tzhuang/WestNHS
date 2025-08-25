// index.js
const express = require('express');
const session = require('express-session');

const getSheetData = require('./login_auth');
const info = require('./info_data');
const { getUserHours, addUserHour, deleteUserHour } = require('./hr_data');
const { checkLoggedIn, bypassLogin } = require('./middlewares');

const quotes = [
  "“Volunteering is an act of heroism on a grand scale. And it matters profoundly. It does more than help people beat the odds; it changes the odds.” -Bill Clinton",
  "“Volunteerism is the voice of the people put into action. These actions shape and mold the present into a future of which we can all be proud.” -Helen Dyer",
  "“Volunteers do not necessarily have the time; they have the heart.” -Elizabeth Andrew",
  "“The heart of a volunteer is never measured in size, but by the depth of the commitment to make a difference in the lives of others.” -DeAnn Hollis",
  "“Volunteering is at the very core of being a human. No one has made it through life without someone else’s help.” -Heather French Henry",
  "“Volunteers don’t get paid, not because they’re worthless, but because they’re priceless.” -Sherry Anderson",
  "“How wonderful that no one need wait a single moment to improve the world.” -Anne Frank",
  "“Volunteers wear working boots but leave a trail of angel footprints.” -Terri Guillemets",
  "“What is the essence of life? To serve others and to do good.” -Aristotle",
  "“A pessimist, they say, sees a glass as being half empty; an optimist sees the same glass as half full. But a giving person sees a glass of water and starts looking for someone who might be thirsty.” -G. Donald Gale",
  "“Doing nothing for others is the undoing of ourselves.” -Horace Mann",
  "“A true healer is not the one with magical powers, but the one who does everything in their power to help those in need.” -Abhijit Naskar",
  "“Life’s most persistent and urgent question is, what are you doing for others?” -Martin Luther King, Jr.",
  "“We are all like one-winged angels. It is only when we help each other that we can fly.” -Luciano De Crescenzo",
  "“Help one another. There’s no time like the present, and no present like the time.” -James Durst",
  "“The best way to find yourself is to lose yourself in the service of others.” -Gandhi",
  "“To ease another’s heartache is to forget one’s own.” -Abraham Lincoln"
];

// Initialize Express
const app = express();
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: false }));
app.use(express.static('public'));

// Session middleware
app.use(session({
  secret: 'my_session_secret',
  resave: true,
  saveUninitialized: false,
  name: 'manfra.io',
}));

app.use((req, res, next) => {
  res.locals.user = req.session.user;
  next();
});

// Routes
app.get('/', checkLoggedIn, (req, res) => {
  const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
  res.render('home', { quote: randomQuote });
});

app.get('/login', bypassLogin, (req, res) => {
  res.render('login', { error: null });
});

app.post('/login', async (req, res) => {
  const id = req.body.id;
  const first = req.body.firstName;
  const last = req.body.lastName;

  try {
    const users = await getSheetData();
    let valid = false;
    let row = 0;

    for (let i = 0; i < users.length; i++) {
      const check = users[i][0];
      if (check === id) {
        if (users[i][1].toLowerCase() === first.toLowerCase().trim() &&
            users[i][2].toLowerCase() === last.toLowerCase().trim()) {
          valid = true;
        }
        row = i;
        break;
      }
    }

    if (valid) {
      const penaltyHours = users[row][5] || 0;
      const m1 = users[row][7] || "";
      const m2 = users[row][8] || "";
      const m3 = users[row][9] || "";

      req.session.user = {
        id,
        firstName: users[row][1],
        lastName: users[row][2],
        penaltyHours,
        m1, m2, m3
      };
      res.redirect('/');
    } else {
      res.render('login', { error: 'Invalid ID or password' });
    }
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).send('Internal server error');
  }
});

app.get('/calendar', checkLoggedIn, async (req, res) => {
  try {
    const { imageUrl, events } = await info.getCalendarEvents();
    res.render('calendar', { events, imageUrl });
  } catch (err) {
    console.error('Calendar error:', err);
    res.status(500).send('Failed to load calendar');
  }
});

app.get('/hrlog', checkLoggedIn, async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { entries, totalHours } = await getUserHours(userId);
    res.render('hrlog', { user: req.session.user, entries, totalHours });
  } catch (err) {
    console.error('HR log error:', err);
    res.status(500).send('Error loading HR log');
  }
});

app.post('/hrlog/add', checkLoggedIn, async (req, res) => {
  const { date, hours, description } = req.body;
  const { id: userId, firstName, lastName } = req.session.user;

  try {
    await addUserHour(userId, date, hours, description, firstName, lastName);
    res.redirect('/hrlog');
  } catch (err) {
    console.error('Add HR entry error:', err);
    res.status(500).send('Failed to add entry');
  }
});

app.post('/hrlog/delete', checkLoggedIn, async (req, res) => {
  const index = parseInt(req.body.index, 10);
  const userId = req.session.user.id;

  if (isNaN(index)) return res.status(400).send('Invalid index');

  try {
    await deleteUserHour(userId, index);
    res.redirect('/hrlog');
  } catch (err) {
    console.error('Delete HR entry error:', err);
    res.status(500).send('Failed to delete entry');
  }
});

app.get('/notifs', checkLoggedIn, async (req, res) => {
  try {
    const notifs = await info.getNotifications();
    res.render('notifs', { notifs });
  } catch (err) {
    console.error('Notifications error:', err);
    res.status(500).send('Failed to load notifications');
  }
});

app.get('/settings', checkLoggedIn, async (req, res) => {
  try {
    const { notifs } = await info.getNotifications();
    const userId = req.session.user.id;
    const { entries, totalHours } = await getUserHours(userId);
    res.render('settings', { notifs, totalHours });
  } catch (err) {
    console.error('Settings error:', err);
    res.status(500).send('Failed to load settings');
  }
});

app.get('/faq', checkLoggedIn, (req, res) => {
  res.render('faq');
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('manfra.io');
    res.redirect('/');
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});