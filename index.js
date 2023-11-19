const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const pdf = require('pdf-parse');
const { OpenAI } = require('openai');
// API KEY OPEN AI : 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

//const openai = new OpenAI("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");
const openai = new OpenAI({ apiKey: "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" });
async function waitForRunCompletion(runId, threadId) {
    let runCompleted = false;
    let runStatus = null;
    while (!runCompleted) {
      const runStatusResponse = await openai.beta.threads.runs.retrieve(threadId, runId);
      runStatus = runStatusResponse.status;
      if (runStatus === 'completed') {
        runCompleted = true;
      } else {
        // Attendre un peu avant de vérifier à nouveau
        await new Promise(resolve => setTimeout(resolve, 5000)); // Attend 5 secondes
      }
    }
    return runStatus;
  }
  
  async function getMessagesFromThread(threadId) {
    const messagesResponse = await openai.beta.threads.messages.list(threadId);
    return messagesResponse.data;
  }

async function generateQuestionsFromText(text) {
  // Faites appel à l'API d'OpenAI en passant le texte
  try {
    console.log("Entrez dans fonction");
    const assistant = await openai.beta.assistants.retrieve(assistantId="asst_7N1b6X3racuZd7HMg0veNuyZ");
    console.log("Assistant récupéré:", assistant);

    // Crée un thread (une conversation)
    const thread = await openai.beta.threads.create();
    console.log("Thread créé, ID:", thread.id);

    // Envoie le message initial à l'assistant dans le thread
    const messageResponse = await openai.beta.threads.messages.create(
      thread.id,
      {
        role: "user",
        content: text
      }
    );
    console.log("Message envoyé, réponse:", messageResponse);
    console.log(messageResponse.content);
    // Exécute le thread et attend la réponse de l'assistant
    const runResponse = await openai.beta.threads.runs.create(
      thread.id,
      {
        assistant_id: assistant.id,
        instructions: 'Crée un quizz à partir du texte en entré, on utilisera le format suivant de Une question et 4 réponses qui sera exactement sous le même format suivant :  Question 1: Quelle est la capitale de la France ?\n' +
        '- Paris\n' +
        '- Berlin\n' +
        '- Rome\n' +
        '- Madrid\n' +
        'Question 2: Qui a écrit "Romeo et Juliette" ?\n' +
        '- William Shakespeare\n' +
        '- Charles Dickens\n' +
        '- Victor Hugo\n' +
        '- Albert Camus\n' +
        'Question 3: Quel élément chimique a pour symbole "O" ?\n' +
        '- Or\n' +
        '- Oxygène\n' +
        '- Osmium\n' +
        '- Olivine\n' +
        "Question 4: En quelle année l'homme a-t-il marché sur la lune pour la première fois ?\n" +
        '- 1969\n' +
        '- 1972\n' +
        '- 1980\n' +
        '- 1955\n' +
        "Question 5: Qui est l'auteur de la théorie de la relativité ?\n" +
        '- Isaac Newton\n' +
        '- Albert Einstein\n' +
        '- Nikola Tesla\n' +
        '- Stephen Hawkin',
      }
    );
    console.log("Run créé, réponse:", runResponse);
    
    // Récupère la liste des messages après que l'assistant ait répondu
    const messages = await openai.beta.threads.messages.list(
      thread.id
    );
    messages.body.data.forEach((message) => {
        
            const assistantContent = message.content[0].text;
            
            console.log("Réponse de l'assistant:", assistantContent);
            
      });
    console.log("Liste des messages de GPT:", messages);
    console.log("le thread : ",thread);
    const runStatus = await waitForRunCompletion(runResponse.id, thread.id);
    var quizText = "";
    if (runStatus === 'completed') {
      // Récupérer tous les messages du thread
      const messages = await getMessagesFromThread(thread.id);
      // Afficher les messages de l'assistant
      for (const message of messages) {
        if (message.role === 'assistant') {
          console.log("Réponse de l'assistant 1 :", message.content[0]);
          quizText = message.content[0].text.value;
          console.log(quizText);
        }
      }
    } else {
      console.log("Le run n'a pas été complété.");
    }
    // Trouvez la réponse de l'assistant
    /*const assistantMessage = messages.data.find(m => m.role === 'assistant');
    if (assistantMessage) {
      console.log("Réponse de l'assistant 2:", assistantMessage.content);
    } else {
      console.log("Aucune réponse de l'assistant trouvée.");
    }
    
    
    
    
    /*const assistant = await openai.beta.assistants.retrieve(assistantId="asst_7N1b6X3racuZd7HMg0veNuyZ");
    console.log("assistant crée");
    console.log(assistant);
    const thread = await openai.beta.threads.create();
      console.log(text);
      const gptResponse = await openai.beta.threads.messages.create(
        thread.id,
        {
          role: "user",
          content: text
        }
      );
      const run = await openai.beta.threads.runs.create(
        thread.id,
        { 
          assistant_id: assistant.id,
          instructions: text
        }
      );
      


      console.log("Exécution créée:", run);

      // Cette étape peut ne pas être nécessaire si la réponse est incluse dans l'objet 'run'.
      // Si vous devez lister les messages pour obtenir la réponse, vous pouvez le faire comme ceci.
      const messages = await openai.beta.threads.messages.list(
        thread.id
      );
      console.log("Liste des messages de GPT:", messages);
      console.log("Body message : ",messages.body.data[0].content);
      console.log("La vrai réponse : ",messages.response)
      //console.log("Data message : ",messages.data[0].content.text.value);
      const keys = Object.keys(messages.response);
      console.log(keys); // Affiche toutes les clés de l'objet messages.response

        // Pour afficher les valeurs de chaque clé
      keys.forEach((key) => {
            console.log(key);
            console.log(`messages.response.${key} : `, messages.response[key]);
      });
      // Pour obtenir la dernière réponse de GPT, vous pouvez filtrer les messages avec le rôle 'assistant'.
      //const gptResponsee = await messages.data.find(m => m.role === 'assistant');
      //console.log("Réponse de GPT:", gptResponsee ? gptResponsee.content : "Pas de réponse de GPT encore.");
    
    /*const gptResponse = await openai.createCompletion({
      model: "text-davinci-002", // ou un modèle plus récent si disponible
      prompt: `Create a quiz based on the following text:\n\n"${text}"\n\n`,
      temperature: 0.7,
      max_tokens: 1024,
      n: 1,
      stop: ["\n", "Question"],
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    });*/

      console.log(quizText);
    // Convertissez le texte en une structure de quiz
      const quizQuestions = quizText.split('Question').slice(1).map(questionText => {
      const [question, ...options] = questionText.trim().split('\n').filter(line => line);
      return {
        text: `Question: ${question}`,
        options: options.map(option => option.substring(1).trim()), // Supprime le tiret et les espaces avant/après
      };
    });

    return quizQuestions;
  } catch (error) {
    console.error('Erreur lors de la génération des questions:', error);
    throw error;
  }
}

function createQuizFromPDF(pdfPath) {
  let dataBuffer = fs.readFileSync(pdfPath);
  console.log('Lecture du fichier PDF:', pdfPath);

  return pdf(dataBuffer).then(async function(data) {
    console.log('Extraction du texte PDF réussie');
    const text = data.text;
    console.log(text);
    // Générer des questions à partir du texte
    try {
      const questions = await generateQuestionsFromText(text);
      console.log('Questions générées:', questions);
      const correctAnswers = questions.map(q => q.options[0]); // Supposons que la première option est toujours correcte
    
    console.log('Quiz créé:', questions);
    console.log('Bonnes réponses:', correctAnswers);
    
    return { questions, correctAnswers };
      //return questions;
    } catch (error) {
      console.error('Erreur lors de la génération des questions:', error);
      throw error;
    }
  });
}


/*   ANCIENNE FONCTION DE TRAITEMENT DE PDF
function createQuizFromPDF(pdfPath) {
    let dataBuffer = fs.readFileSync(pdfPath);
    console.log('Lecture du fichier PDF:', pdfPath);

    return pdf(dataBuffer).then(function(data) {
        console.log('Extraction du texte PDF réussie');
        const text = data.text;

        const lines = text.split('\n'); // Diviser le texte en lignes
        console.log('Lignes extraites:', lines);

        let questions = [];
        let currentQuestion = null;

        lines.forEach(line => {
            if (line.startsWith("Question")) {
                if (currentQuestion) {
                    questions.push(currentQuestion);
                }
                currentQuestion = { text: line, options: [] };
                console.log('Nouvelle question détectée:', line);
            } else if (line.startsWith("-") && currentQuestion) {
                currentQuestion.options.push(line.substring(1).trim()); // Supprime le tiret et les espaces avant/après
                console.log('Option ajoutée:', line);
            }
        });

        if (currentQuestion) {
            questions.push(currentQuestion);
        }
    
        // Ajouter la logique pour stocker les bonnes réponses
        const correctAnswers = questions.map(q => q.options[0]); // Supposons que la première option est toujours correcte
    
        console.log('Quiz créé:', questions);
        console.log('Bonnes réponses:', correctAnswers);
    
        return { questions, correctAnswers };
    });
}
*/
const app = express();
app.use(cors());
app.use(express.json());
let quizzes = [];

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const filename = file.fieldname + '-' + Date.now() + '.pdf';
        console.log('Fichier reçu:', filename);
        cb(null, filename);
    }
});

const upload = multer({ storage: storage });
const port = 5000;

app.get('/', (req, res) => {
    res.send('Bienvenue sur le serveur de BrainBurst');
});

app.get('/quizzes', (req, res) => {
    console.log('Demande de récupération des quizzes');
    res.json(quizzes);
});

app.get('/courses', (req, res) => {
    console.log('Demande de récupération des cours');
    res.json([{ id: 1, title: "Cours 1" }, { id: 2, title: "Cours 2" }]);
});

app.post('/upload', upload.single('file'), (req, res) => {
    if (req.file && req.file.mimetype === 'application/pdf') {
        createQuizFromPDF(req.file.path)
            .then(quiz => {
                quizzes.push(quiz); // Ajouter le quiz à la liste des quizzes
                res.send({ message: "Cours téléchargé et quiz créé", quiz });
                fs.unlinkSync(req.file.path);
                console.log('Quiz ajouté et fichier PDF supprimé');
            })
            .catch(error => {
                console.error('Erreur lors de la création du quiz:', error);
                res.status(500).send({ message: "Erreur lors de la création du quiz", error });
            });
    } else {
        console.log('Tentative de téléchargement d\'un fichier non PDF');
        res.status(400).send({ message: "Veuillez télécharger un fichier PDF." });
    }
});

app.use((req, res, next) => {
    res.status(404).send("Désolé, cette page n'existe pas !");
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Quelque chose a mal tourné!');
});

app.post('/submit-answers', (req, res) => {
    const userAnswers = req.body; // Les réponses de l'utilisateur

    // Supposons que le dernier quiz ajouté est celui auquel l'utilisateur répond
    const currentQuiz = quizzes[quizzes.length - 1];
    if (!currentQuiz) {
        return res.status(404).send({ message: "Quiz non trouvé" });
    }

    // Comparer les réponses de l'utilisateur avec les bonnes réponses
    const results = currentQuiz.correctAnswers.map((answer, index) => answer === userAnswers[index]);

    console.log('Réponses de l\'utilisateur:', userAnswers);
    console.log('Résultats:', results);

    // Envoyer les résultats au client
    res.json(results);
});


app.listen(port, () => {
    console.log(`Serveur lancé sur http://localhost:${port}`);
});
