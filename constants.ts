export interface ReflectionCard {
  id: number;
  category: 'past' | 'transition' | 'future' | 'identity';
  questions: {
    'en-GB': string;
    'zh-HK': string;
  };
}

export const REFLECTION_CARDS: ReflectionCard[] = [
  {
    id: 1,
    category: 'transition',
    questions: {
      'en-GB': "If you had to use three key words to describe your life since coming to the UK, which three would you choose, and why?",
      'zh-HK': "如果用三個關鍵字來形容你來英國之後的生活，你會選哪三個？為什麼？"
    }
  },
  {
    id: 2,
    category: 'transition',
    questions: {
      'en-GB': "In the first few months after arriving in the UK, what gave you the biggest feeling of 'culture shock'? How would you describe what that shock felt like at the time?",
      'zh-HK': "剛到英國的頭幾個月，什麼事情讓你最有「文化衝擊」的感覺？你當時心裡怎樣形容那個衝擊？"
    }
  },
  {
    id: 3,
    category: 'transition',
    questions: {
      'en-GB': "In your everyday life in the UK, is there a small habit or routine that makes you feel, 'I'm finally starting to settle'? How does that habit make you feel?",
      'zh-HK': "在英國的日常生活裡，有沒有一個小小的習慣，讓你覺得「總算有點穩定下來」？那個習慣帶給你什麼感覺？"
    }
  },
  {
    id: 4,
    category: 'transition',
    questions: {
      'en-GB': "What was the most recent moment when you thought, 'Oh, I can actually enjoy myself here too'? What was happening then?",
      'zh-HK': "最近一次讓你覺得「啊，原來我也可以在這裡開心一下」的時刻是什麼？當時發生了什麼事？"
    }
  },
  {
    id: 5,
    category: 'transition',
    questions: {
      'en-GB': "In the process of settling your family in the UK, which part have you found the hardest (e.g., housing, schools, emotions, finances)? What has this affected most in your life?",
      'zh-HK': "在英國安頓家庭的過程裡，你覺得最不容易的是哪一部分？（例如：住房、學校、家人情緒、經濟等）這對你影響最大的是什麼？"
    }
  },
  {
    id: 6,
    category: 'identity',
    questions: {
      'en-GB': "Since moving to the UK, do you feel your role in the family has changed? What have you taken on more of, and what have you done less of? How does that make you feel?",
      'zh-HK': "你覺得來到英國之後，自己在家庭中的角色有沒有改變？多了什麼、少了什麼？那帶給你什麼感覺？"
    }
  },
  {
    id: 7,
    category: 'past',
    questions: {
      'en-GB': "When your family was deciding whether to move to the UK, what is one conversation you remember most clearly? What did that conversation mean to you?",
      'zh-HK': "在家庭決定移民或搬來英國的過程中，你最記得的一個對話是什麼？那段對話對你意味著什麼？"
    }
  },
  {
    id: 8,
    category: 'past',
    questions: {
      'en-GB': "For the sake of your family, what is the most difficult decision you have made in this whole moving journey? How did you feel after making it?",
      'zh-HK': "為了家人，你在這段移居旅程中做過最「唔容易」的一個決定是什麼？做完之後你的心情是怎樣的？"
    }
  },
  {
    id: 9,
    category: 'past',
    questions: {
      'en-GB': "In your view, how is your family's pressure in the UK different from when you were in Hong Kong? Which kind of pressure do you personally feel the most?",
      'zh-HK': "你覺得在英國，家人的壓力跟在香港有什麼不一樣？你自己最感受到的是哪一種？"
    }
  },
  {
    id: 10,
    category: 'identity',
    questions: {
      'en-GB': "When there is conflict or disagreement in the family, what role do you usually play? Is this similar to the role you played in Hong Kong?",
      'zh-HK': "當家人之間出現衝突或意見不合時，你通常會扮演什麼角色？（例如：調解者、沉默的那個、爆發的那個…）這跟你以前在香港時一樣嗎？"
    }
  },
  {
    id: 11,
    category: 'transition',
    questions: {
      'en-GB': "Has there been a moment when you suddenly felt, 'We are all so tired, but we are also very strong as a family'? What was happening at that time?",
      'zh-HK': "有沒有一個時刻，讓你突然覺得：「原來我們一家人都好累，但也好堅強」？那一刻發生了什麼？"
    }
  },
  {
    id: 12,
    category: 'identity',
    questions: {
      'en-GB': "If you could say one very honest thing to your family that is usually hard to say out loud, what would you say?",
      'zh-HK': "如果可以跟家人說一句最真心但平時難以開口的話，你會說什麼？"
    }
  },
  {
    id: 13,
    category: 'transition',
    questions: {
      'en-GB': "Before coming to the UK, what did you imagine your future work would be like? How is it different from your current reality? How does that gap make you feel?",
      'zh-HK': "來到英國之前，你對自己未來工作的想像是怎樣的？跟現在的實際情況有什麼差距？那種差距帶給你什麼感受？"
    }
  },
  {
    id: 14,
    category: 'transition',
    questions: {
      'en-GB': "In the process of looking for work, changing career or re-qualifying in the UK, was there a moment when you felt particularly defeated? What were you saying to yourself in your mind at that time?",
      'zh-HK': "在英國找工作、轉行或重讀資格的過程中，有沒有哪一刻令你特別挫敗？當時你心裡對自己說了什麼？"
    }
  },
  {
    id: 15,
    category: 'future',
    questions: {
      'en-GB': "Since coming to the UK, have you discovered any 'unexpected advantages' in your work or abilities? For example a certain experience, language skill or attitude?",
      'zh-HK': "來英國之後，你有沒有發現自己在工作或能力上有一些「意想不到的優勢」？例如某種經驗、語言、態度特別有用？"
    }
  },
  {
    id: 16,
    category: 'future',
    questions: {
      'en-GB': "If you didn't have to think about practical limits (such as visa, qualifications, money), what kind of job or career would you most like to try, and why?",
      'zh-HK': "如果不考慮現實限制（簽證、學歷、錢等），你最想試的一種工作或職涯方向會是什麼？為什麼？"
    }
  },
  {
    id: 17,
    category: 'transition',
    questions: {
      'en-GB': "In the UK job market or workplace, what do you feel is the biggest challenge of being a Hongkonger / a new migrant? How do you see this challenge?",
      'zh-HK': "你覺得在英國的職場或求職過程中，作為香港人／新移民，最大的挑戰是什麼？你怎樣看待這個挑戰？"
    }
  },
  {
    id: 18,
    category: 'past',
    questions: {
      'en-GB': "Thinking of your past work experience in Hong Kong, is there a part of it you would really like to carry on using in the UK? What value or ability does that represent in you?",
      'zh-HK': "想起你過去在香港的一段工作經驗，有沒有哪個部份是你很想帶來英國繼續使用的？那代表了你什麼樣的價值或能力？"
    }
  },
  {
    id: 19,
    category: 'future',
    questions: {
      'en-GB': "When you think about your future work, what are the three things you care about most (e.g. income, flexible time, meaning, stability)? Why are these three things so important to you?",
      'zh-HK': "在考慮未來工作時，你最在乎的三件事是什麼？（例如：收入、時間彈性、意義感、穩定性、成長空間…）這三件事背後對你有什麼重要意義？"
    }
  },
  {
    id: 20,
    category: 'past',
    questions: {
      'en-GB': "Has anyone (a colleague, friend or mentor) ever given you a phrase or a kind of support that really mattered in your career? How does that still affect you now when you think of it?",
      'zh-HK': "曾經有沒有一個人（同事、朋友、導師）在你職涯上給過你很重要的一句話或一個支持？那句話現在聽起來對你還有什麼影響？"
    }
  },
  {
    id: 21,
    category: 'identity',
    questions: {
      'en-GB': "If you used an image to represent your current identity (e.g. between Hong Kong and the UK, new migrant, parent, professional – all overlapping), what picture would you choose? What does that picture say about you?",
      'zh-HK': "如果要用圖像比喻你現在的身份狀態（例如：在香港與英國之間、新移民、家長、專業人士等重疊），你會選什麼畫面？那個畫面說明了什麼？"
    }
  },
  {
    id: 22,
    category: 'identity',
    questions: {
      'en-GB': "For you personally, what are the core qualities of being 'a Hongkonger'? In your UK life, have these qualities helped you, or have they sometimes created clashes?",
      'zh-HK': "你覺得「香港人」這個身份，對你來說最核心的幾個特質是什麼？這些特質在英國生活裡有幫到你，還是有時會造成衝突？"
    }
  },
  {
    id: 23,
    category: 'transition',
    questions: {
      'en-GB': "During your time living in the UK, has there been a moment when you strongly felt, 'I really am an outsider here'? What were your real emotions in that moment?",
      'zh-HK': "在英國生活的這段時間，有沒有一刻讓你強烈感覺到「原來我是外人」？那一刻你內心真正的情緒是什麼？"
    }
  },
  {
    id: 24,
    category: 'transition',
    questions: {
      'en-GB': "And has there been a moment when you felt, 'I'm starting to feel a bit of belonging here'? What happened at that time?",
      'zh-HK': "又有沒有一個時刻，讓你覺得「好像開始有少少歸屬感」？那時發生了什麼事？"
    }
  },
  {
    id: 25,
    category: 'identity',
    questions: {
      'en-GB': "How would you introduce your story to a British friend? When you tell this version of yourself, is there any part that still feels difficult for you to talk about?",
      'zh-HK': "你會怎樣向英國朋友介紹自己的故事？當你說出這個版本的自己時，有沒有哪一部分是你仍然有點難以提起的？"
    }
  },
  {
    id: 26,
    category: 'identity',
    questions: {
      'en-GB': "In your heart, what does the word 'home' mean to you now? How is that different from what 'home' meant when you were in Hong Kong?",
      'zh-HK': "在你心裡，「家」這個字現在是什麼意思？跟你在香港時的理解有什麼不同？"
    }
  },
  {
    id: 27,
    category: 'future',
    questions: {
      'en-GB': "Since coming to the UK, has your definition of 'a successful life' changed? How would you now describe 'a life that is going reasonably well'?",
      'zh-HK': "來到英國之後，你對「成功的人生」這件事的定義有沒有改變？現在你會怎樣描述一個「活得算不錯」的人生？"
    }
  },
  {
    id: 28,
    category: 'identity',
    questions: {
      'en-GB': "When it comes to identity, where do you feel the strongest tension or pull inside yourself at the moment? How do you usually live with or handle that tension?",
      'zh-HK': "在身份認同上，你覺得目前自己最矛盾或拉扯的地方是什麼？你通常怎樣跟這種矛盾相處？"
    }
  },
  {
    id: 29,
    category: 'future',
    questions: {
      'en-GB': "Looking back at the changes in the past few years, in what ways do you feel you have become stronger or more mature? Can you share one concrete example?",
      'zh-HK': "回頭看這幾年的變化，你覺得自己在哪一方面比從前更強大、更成熟？有沒有一個具體情節可以說明？"
    }
  },
  {
    id: 30,
    category: 'future',
    questions: {
      'en-GB': "If, in the next three years, you could create one small change for yourself and your family, what would it be? What would that change symbolise for you?",
      'zh-HK': "如果未來三年，你可以為自己和家人創造一個小小的改變，那會是什麼？這個改變對你來說象徵什麼？"
    }
  },
  {
    id: 31,
    category: 'past',
    questions: {
      'en-GB': "Imagine a Hong Kong family who has just arrived in the UK, very similar to how you were when you first came, asks you for advice. What three things would you most want to say to them? Are these also three things you'd like to say to yourself right now?",
      'zh-HK': "想像有一個剛來英國、跟你當年很相似的香港家庭向你請教，你最想跟他們分享哪三句話？這三句話也是想對現在的自己說的嗎？"
    }
  },
  {
    id: 32,
    category: 'future',
    questions: {
      'en-GB': "If your story of coming to and living in the UK was a book, which chapter do you think you are in now? What would you like the title of the next chapter to be, and why?",
      'zh-HK': "如果把你來英國的故事當成一本書，你覺得現在是第幾章？你希望下一章的書名會叫什麼？為什麼？"
    }
  },
  {
    id: 33,
    category: 'past',
    questions: {
      'en-GB': "When you think back over all the difficult years, is there a phrase or belief that has kept you going? If you turned it into a personal motto, what would it be?",
      'zh-HK': "當你回想這幾年所有難捱的時刻，有沒有哪一句說話、哪一個信念，一直在撐住你？如果要把它寫成一句座右銘，會是什麼？"
    }
  },
  {
    id: 34,
    category: 'future',
    questions: {
      'en-GB': "Imagine that five years from now, a journalist interviews you and asks, 'What are you most proud of from these last few years?' How would you hope to be able to answer?",
      'zh-HK': "想像五年後有一位記者訪問你，問你：「這幾年你最自豪的一件事是什麼？」你希望自己那時候會怎樣回答？"
    }
  },
  {
    id: 35,
    category: 'future',
    questions: {
      'en-GB': "If you could adjust the balance between 'feeling safe', 'having freedom' and 'a sense of achievement' in your future life, which one would you most want to improve first, and why?",
      'zh-HK': "如果未來的生活可以在「安全感」、「自由度」、「成就感」三樣之間做一個調整，你最想先改善哪一樣？為什麼？"
    }
  },
  {
    id: 36,
    category: 'future',
    questions: {
      'en-GB': "In the coming years, which group of people or what kind of people would you most like to help or have a positive impact on? How does that connect with your own past experiences?",
      'zh-HK': "在未來的日子裡，你最想為哪一個群體或哪一種類型的人帶來幫助或影響？這跟你過去的哪些經歷有關？"
    }
  },
  {
    id: 37,
    category: 'future',
    questions: {
      'en-GB': "Imagine there is a 'more calm and steady' version of you walking towards you from the future. What small step do you think they would encourage you to take today, as a move towards that future?",
      'zh-HK': "假如有一個「更從容、更穩定」版本的自己正在向你走來，你覺得他／她今天會鼓勵你做哪一個小小的行動，作為踏向未來的一步？"
    }
  },
  {
    id: 38,
    category: 'future',
    questions: {
      'en-GB': "When you imagine your older self, at the end of life, looking back at you now, what do you hope they will see? How would you like them to speak about the courage you are showing in this stage of your life?",
      'zh-HK': "當你想像人生晚年的自己回望現在，你最希望他／她看到什麼？你希望他／她會怎樣評價你現在這個階段的勇氣？"
    }
  }
];