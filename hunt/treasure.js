
const questions = {
  "1234": {
    text: "What do you have to give at the end of Beverley Gardens?",
    evaluator: (answer) => (answer.toLowerCase() === "way"),
    next: "12345"
  },

  "12345": {
    text: "What is the latest you can send a letter from London on a weekday?",
    evaluator: (answer) => answer.includes("9"),
    next: "1223234345"
  },

  "1223234345": {
    text: "What is the sum of the buses opposite CSL?",
    evaluator: (answer) => answer === "1810",
    next: "8566"
  },

  "8566": {
    text: "How many items are on the shelf?",
    evaluator: (answer) => answer === "6",
    next: "53454"
  },

  "53454": {
    text: "Retrace your steps then go to “the garage” what can you recharge for £55?",
    evaluator: (answer) => answer.toLowerCase().includes("air"),
    next: "23423"
  },

  "23423": {
    text: "How much does Fred Dibnah spend on unleaded petrol?",
    evaluator: (answer) => answer.includes("155"),
    next: "32423"
  },

  "32423": {
    text: "Go to the Giggly Goose scene to find QR code Number 2?",
    evaluator: (answer) => answer.includes("QR1235"),
    next: "QR1235"
  },

  "QR1235": {
    text: "Make sure Daddy is not working in the holidays, and go to the Zone end to get the next QR code",
    evaluator: (answer) => answer.includes("QR5345"),
    next: "QR5345"
  },

  "QR5345": {
    text: "Who protects the library?",
    evaluator: (answer) => answer.toLowerCase().includes("mayfair"),
    next: "A12312"
  },

  "A12312": {
    text: "In the BT car park who do you get to fix your tap?",
    evaluator: (answer) => answer.toUpperCase().includes("STEPHENSON"),
    next: "A8888"
  },

  "A8888": {
    text: "Go down Strakers Passage.  Opposite Zebedee's shop, how much is Shakahuka?",
    evaluator: (answer) => answer.includes("7.75"),
    next: "B324"
  },

  "B324": {
    text: "Down the creepy alley how many flats are in the Old Mill?",
    evaluator: (answer) => answer.includes("4"),
    next: "MS123"
  },

  "MS123": {
    text: "In your favourite shop, what is ready in aisle 1?",
    evaluator: (answer) => answer.toLowerCase().includes("banana"),
    next: "C1111"
  },

  "C1111": {
    text: "Go out the other door and past the best cereal shop in the world.  What has Barry Crux sold?",
    evaluator: (answer) => answer.toLowerCase().includes("lewin"),
    next: "D111"
  },

  "D111": {
    text: "How big is the second floor of Debenhams?",
    evaluator: (answer) => answer.toLowerCase().includes("101"),
    next: "Y6666"
  },

  "Y6666": {
    text: "When was the YPS founded?",
    evaluator: (answer) => answer.toLowerCase().includes("1822"),
    next: "S5555"
  },

  "S5555": {
    text: "Where exactly can you see the stars?",
    evaluator: (answer) => answer.toLowerCase().includes("53"),
    next: "F555553"
  },

  "F555553": {
    text: "Follow the fence to see Jacob and get the next QR code from the closed gate",
    evaluator: (answer) => answer.includes("QR999"),
    next: "QR999"
  },

  "QR999": {
    text: "How many stars does 'roots' have?",
    evaluator: (answer) => answer.toLowerCase().includes("1"),
    next: "LL3333"
  },

  "LL3333": {
    text: " How many love locks are on the bridge?",
    evaluator: (answer) => parseInt(answer, 10) >= 18 && parseInt(answer, 10) <= 22,
    next: "W66455"
  },

   "W66455": {
    text: "Go past the Perky Peacock which Womble is having an argument?",
    evaluator: (answer) => answer.toLowerCase().includes("wellington"),
    next: "W333"
  },

  "W333": {
    text: "Who is underneath Craven W.V on the War Memorial?",
    evaluator: (answer) => answer.toLowerCase().includes("crawford"),
    next: "FFFF"
  },  

  "FFFF": {
    text: "Cross the road carefully and go up the stairs and turn right and walk to the far end. Find the next QR code on the right gate post and ring us when you get there!",
    evaluator: (answer) => answer.toLowerCase().includes("crawford"),
    next: "FFFF"
  },    
}

const readQuestionId = () => {
  const searchParams = new URLSearchParams(location.search);
  const questionID = searchParams.get('q')
  return questionID
}

const getQuestion = () => {
  const questionID = readQuestionId()
  const question = questions[questionID]
  if (question === undefined) {
    return "I don't know that question"
  } else {
    return question
  }
}

const checkAnswer = (event) => {
  event.preventDefault();
  const answer = document.getElementById("answer").value
  if (getQuestion().evaluator(answer)) {
    window.location.href = "/hunt/index.html?q=" + getQuestion().next
  } else {
    document.getElementById("question").innerHTML = "Sorry that is the wrong answer"
  }
}



document.getElementById("question").innerHTML = getQuestion().text;