import { Quote } from '../types';

// Built-in motivational quotes for offline use
const motivationalQuotes: Quote[] = [
  {
    id: '1',
    text: 'The secret of getting ahead is getting started.',
    author: 'Mark Twain',
    category: 'motivation',
  },
  {
    id: '2',
    text: 'It does not matter how slowly you go as long as you do not stop.',
    author: 'Confucius',
    category: 'motivation',
  },
  {
    id: '3',
    text: "Believe you can and you're halfway there.",
    author: 'Theodore Roosevelt',
    category: 'motivation',
  },
  {
    id: '4',
    text: 'The only way to do great work is to love what you do.',
    author: 'Steve Jobs',
    category: 'productivity',
  },
  {
    id: '5',
    text: 'Success is not final, failure is not fatal: it is the courage to continue that counts.',
    author: 'Winston Churchill',
    category: 'success',
  },
  {
    id: '6',
    text: 'The future belongs to those who believe in the beauty of their dreams.',
    author: 'Eleanor Roosevelt',
    category: 'motivation',
  },
  {
    id: '7',
    text: 'Don\'t watch the clock; do what it does. Keep going.',
    author: 'Sam Levenson',
    category: 'productivity',
  },
  {
    id: '8',
    text: 'Everything you\'ve ever wanted is on the other side of fear.',
    author: 'George Addair',
    category: 'motivation',
  },
  {
    id: '9',
    text: 'The only limit to our realization of tomorrow is our doubts of today.',
    author: 'Franklin D. Roosevelt',
    category: 'motivation',
  },
  {
    id: '10',
    text: 'What you get by achieving your goals is not as important as what you become by achieving your goals.',
    author: 'Zig Ziglar',
    category: 'success',
  },
  {
    id: '11',
    text: 'Start where you are. Use what you have. Do what you can.',
    author: 'Arthur Ashe',
    category: 'productivity',
  },
  {
    id: '12',
    text: 'A journey of a thousand miles begins with a single step.',
    author: 'Lao Tzu',
    category: 'motivation',
  },
  {
    id: '13',
    text: 'The best time to plant a tree was 20 years ago. The second best time is now.',
    author: 'Chinese Proverb',
    category: 'productivity',
  },
  {
    id: '14',
    text: 'Your time is limited, don\'t waste it living someone else\'s life.',
    author: 'Steve Jobs',
    category: 'motivation',
  },
  {
    id: '15',
    text: 'Success is walking from failure to failure with no loss of enthusiasm.',
    author: 'Winston Churchill',
    category: 'success',
  },
];

const encouragementQuotes: Quote[] = [
  {
    id: 'e1',
    text: 'You did it! Every completed task is a step towards your success.',
    author: 'TaskBuilder',
    category: 'encouragement',
  },
  {
    id: 'e2',
    text: 'Amazing work! Your consistency is building habits that will change your life.',
    author: 'TaskBuilder',
    category: 'encouragement',
  },
  {
    id: 'e3',
    text: 'Fantastic! You\'re proving to yourself that you can achieve anything you set your mind to.',
    author: 'TaskBuilder',
    category: 'encouragement',
  },
  {
    id: 'e4',
    text: 'Well done! Small wins lead to big victories. Keep going!',
    author: 'TaskBuilder',
    category: 'encouragement',
  },
  {
    id: 'e5',
    text: 'Excellent! You\'re on a roll. This momentum is unstoppable!',
    author: 'TaskBuilder',
    category: 'encouragement',
  },
  {
    id: 'e6',
    text: 'Great job! Every task you complete strengthens your discipline.',
    author: 'TaskBuilder',
    category: 'encouragement',
  },
  {
    id: 'e7',
    text: 'Wonderful! You\'re making progress that your future self will thank you for.',
    author: 'TaskBuilder',
    category: 'encouragement',
  },
  {
    id: 'e8',
    text: 'Brilliant work! Your dedication is truly inspiring.',
    author: 'TaskBuilder',
    category: 'encouragement',
  },
  {
    id: 'e9',
    text: 'Superb! You\'re building the life you want, one task at a time.',
    author: 'TaskBuilder',
    category: 'encouragement',
  },
  {
    id: 'e10',
    text: 'Outstanding! Keep this energy - you\'re achieving greatness!',
    author: 'TaskBuilder',
    category: 'encouragement',
  },
];

const productivityQuotes: Quote[] = [
  {
    id: 'p1',
    text: 'Focus on being productive instead of busy.',
    author: 'Tim Ferriss',
    category: 'productivity',
  },
  {
    id: 'p2',
    text: 'The way to get started is to quit talking and begin doing.',
    author: 'Walt Disney',
    category: 'productivity',
  },
  {
    id: 'p3',
    text: 'Productivity is never an accident. It is always the result of a commitment to excellence.',
    author: 'Paul J. Meyer',
    category: 'productivity',
  },
  {
    id: 'p4',
    text: 'Action is the foundational key to all success.',
    author: 'Pablo Picasso',
    category: 'productivity',
  },
  {
    id: 'p5',
    text: 'You don\'t have to be great to start, but you have to start to be great.',
    author: 'Zig Ziglar',
    category: 'productivity',
  },
];

class QuotesService {
  private usedQuoteIds: Set<string> = new Set();

  // Get a random motivational quote
  getRandomMotivationalQuote(): Quote {
    return this.getRandomQuote(motivationalQuotes);
  }

  // Get a random encouragement quote
  getRandomEncouragementQuote(): Quote {
    return this.getRandomQuote(encouragementQuotes);
  }

  // Get a random productivity quote
  getRandomProductivityQuote(): Quote {
    return this.getRandomQuote(productivityQuotes);
  }

  // Get a random quote from any category
  getRandomQuote(quotes: Quote[] = [...motivationalQuotes, ...encouragementQuotes, ...productivityQuotes]): Quote {
    // Reset used quotes if all have been shown
    if (this.usedQuoteIds.size >= quotes.length) {
      this.usedQuoteIds.clear();
    }

    // Filter out used quotes
    const availableQuotes = quotes.filter(q => !this.usedQuoteIds.has(q.id));

    // Get random quote
    const randomIndex = Math.floor(Math.random() * availableQuotes.length);
    const quote = availableQuotes[randomIndex];

    // Mark as used
    this.usedQuoteIds.add(quote.id);

    return quote;
  }

  // Get quote by category
  getQuoteByCategory(category: Quote['category']): Quote {
    const categoryQuotes = this.getAllQuotes().filter(q => q.category === category);
    return this.getRandomQuote(categoryQuotes);
  }

  // Get all quotes
  getAllQuotes(): Quote[] {
    return [...motivationalQuotes, ...encouragementQuotes, ...productivityQuotes];
  }

  // Get quotes for incomplete task motivation
  getIncompleteTaskMotivation(): Quote {
    const incompleteTaskQuotes: Quote[] = [
      {
        id: 'it1',
        text: 'This task is waiting for you to conquer it. You\'ve got this!',
        author: 'TaskBuilder',
        category: 'motivation',
      },
      {
        id: 'it2',
        text: 'Every unfinished task is an opportunity to prove yourself. Start now!',
        author: 'TaskBuilder',
        category: 'motivation',
      },
      {
        id: 'it3',
        text: 'The hardest part is starting. Once you begin, momentum will carry you through.',
        author: 'TaskBuilder',
        category: 'motivation',
      },
      {
        id: 'it4',
        text: 'Don\'t put off until tomorrow what you can accomplish today!',
        author: 'TaskBuilder',
        category: 'motivation',
      },
      {
        id: 'it5',
        text: 'Your future self will thank you for tackling this task right now.',
        author: 'TaskBuilder',
        category: 'motivation',
      },
    ];

    return this.getRandomQuote(incompleteTaskQuotes);
  }

  // Get streak celebration quote
  getStreakCelebration(streakDays: number): string {
    if (streakDays >= 30) {
      return `Incredible! ${streakDays} days streak! You're a productivity legend!`;
    } else if (streakDays >= 14) {
      return `Amazing! ${streakDays} days streak! You're building unstoppable habits!`;
    } else if (streakDays >= 7) {
      return `Great job! ${streakDays} days streak! A full week of productivity!`;
    } else if (streakDays >= 3) {
      return `Nice! ${streakDays} days streak! Keep the momentum going!`;
    } else {
      return `Good start! ${streakDays} days streak! Every day counts!`;
    }
  }

  // Get completion milestone quote
  getCompletionMilestone(completedTasks: number): string | null {
    const milestones = [10, 25, 50, 100, 250, 500, 1000];

    if (milestones.includes(completedTasks)) {
      return `Milestone reached! You've completed ${completedTasks} tasks! Keep up the amazing work!`;
    }
    return null;
  }

  // Reset used quotes
  resetUsedQuotes(): void {
    this.usedQuoteIds.clear();
  }
}

export const quotesService = new QuotesService();
export default quotesService;
