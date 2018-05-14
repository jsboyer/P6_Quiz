const Sequelize = require("sequelize");
const {models} = require("../models");

// Autoload the quiz with id equals to :quizId
exports.load = (req, res, next, quizId) => {

    models.quiz.findById(quizId)
    .then(quiz => {
        if (quiz) {
            req.quiz = quiz;
            next();
        } else {
            throw new Error('There is no quiz with id=' + quizId);
        }
    })
    .catch(error => next(error));
};


// GET /quizzes
exports.index = (req, res, next) => {

    models.quiz.findAll()
    .then(quizzes => {
        res.render('quizzes/index.ejs', {quizzes});
    })
    .catch(error => next(error));
};


// GET /quizzes/:quizId
exports.show = (req, res, next) => {

    const {quiz} = req;

    res.render('quizzes/show', {quiz});
};


// GET /quizzes/new
exports.new = (req, res, next) => {

    const quiz = {
        question: "", 
        answer: ""
    };

    res.render('quizzes/new', {quiz});
};

// POST /quizzes/create
exports.create = (req, res, next) => {

    const {question, answer} = req.body;

    const quiz = models.quiz.build({
        question,
        answer
    });

    // Saves only the fields question and answer into the DDBB
    quiz.save({fields: ["question", "answer"]})
    .then(quiz => {
        req.flash('success', 'Quiz created successfully.');
        res.redirect('/quizzes/' + quiz.id);
    })
    .catch(Sequelize.ValidationError, error => {
        req.flash('error', 'There are errors in the form:');
        error.errors.forEach(({message}) => req.flash('error', message));
        res.render('quizzes/new', {quiz});
    })
    .catch(error => {
        req.flash('error', 'Error creating a new Quiz: ' + error.message);
        next(error);
    });
};


// GET /quizzes/:quizId/edit
exports.edit = (req, res, next) => {

    const {quiz} = req;

    res.render('quizzes/edit', {quiz});
};


// PUT /quizzes/:quizId
exports.update = (req, res, next) => {

    const {quiz, body} = req;

    quiz.question = body.question;
    quiz.answer = body.answer;

    quiz.save({fields: ["question", "answer"]})
    .then(quiz => {
        req.flash('success', 'Quiz edited successfully.');
        res.redirect('/quizzes/' + quiz.id);
    })
    .catch(Sequelize.ValidationError, error => {
        req.flash('error', 'There are errors in the form:');
        error.errors.forEach(({message}) => req.flash('error', message));
        res.render('quizzes/edit', {quiz});
    })
    .catch(error => {
        req.flash('error', 'Error editing the Quiz: ' + error.message);
        next(error);
    });
};


// DELETE /quizzes/:quizId
exports.destroy = (req, res, next) => {

    req.quiz.destroy()
    .then(() => {
        req.flash('success', 'Quiz deleted successfully.');
        res.redirect('/quizzes');
    })
    .catch(error => {
        req.flash('error', 'Error deleting the Quiz: ' + error.message);
        next(error);
    });
};


// GET /quizzes/:quizId/play
exports.play = (req, res, next) => {

    const {quiz, query} = req;

    const answer = query.answer || '';

    res.render('quizzes/play', {
        quiz,
        answer
    });
};


// GET /quizzes/:quizId/check
exports.check = (req, res, next) => {

    const {quiz, query} = req;

    const answer = query.answer || "";
    const result = answer.toLowerCase().trim() === quiz.answer.toLowerCase().trim();

    res.render('quizzes/result', {
        quiz,
        result,
        answer
    });
};



//randomplay
exports.randomPlay = (req, res, next) => {
    
    console.log('aquí');
    req.session.allquizzes = [];
    models.quiz.findAll()
    .each(quiz => {
        req.session.allquizzes.push(quiz);
    })
    .then(allquizzes => {
        let score = 0;
        console.log('quizzes ' + req.session.allquizzes);
        

        if (req.session.randomPlay == undefined || req.session.randomPlay == []){
            req.session.randomPlay = [];
            req.session.quizzesPorJugar = req.session.allquizzes;
            score = 0;
        } else {
            score = req.session.randomPlay.length;
        }

        console.log('quizzes por jugar ' + req.session.quizzesPorJugar);
        console.log('idsazar antes ' + req.session.idsAzar);

        let idAzar = Math.floor(Math.random()*req.session.allquizzes.length);

        while (req.session.idsAzar.includes(idAzar)){
            idAzar = Math.floor(Math.random()*req.session.allquizzes.length);
        }
        req.session.idsAzar.push(idAzar);
        console.log('idsazar despues ' + req.session.idsAzar);
       /* do {
            idAzar = parseInt(Math.random()*quizzes.length);
        }  while (!quizzesPorJugar.includes(idAzar)); */

       /* while ((idAzar !== 0) && (!req.session.quizzesPorJugar.includes(req.session.allquizzes[idAzar]))) {
            idAzar --;
        }; */

        console.log('idazar ' + idAzar);
        console.log('score ' + score);

        let quiz = req.session.allquizzes[idAzar];
        req.session.randomPlay.push(idAzar);
        //req.session.quizzesPorJugar[idAzar] = "";
        //req.session.quizzesPorJugar.splice(idAzar,1);
        score = req.session.randomPlay.length - 1;
        console.log('también');
        res.render('quizzes/random_play', {
            score,
            quiz
        });
    })
    .catch(error => {
        req.flash('error', 'Error playing: ' + error.message);
        next(error);
    })
 

    
};

//randomplay
exports.randomCheck = (req, res, next) => {

    const {quiz, query} = req;

    const answer = query.answer || '';

    const result = answer.toLowerCase().trim() === quiz.answer.toLowerCase().trim();

    let score = req.session.randomPlay.length;
    
    if (req.session.randomPlay.length >= req.session.allquizzes.length){
        req.session.randomPlay = [];
        req.session.quizzesPorJugar = [];
        req.session.idsAzar = [];
        res.render('quizzes/random_nomore', {
            score
        });
    } else if(result){
        //let score = req.session.randomPlay.length;
        req.session.idsAzar = req.session.idsAzar;
        res.render('quizzes/random_result', {
            score,
            answer,
            result
        });
    }else if (!result){
        //let score = 0;
        score --;
        req.session.randomPlay = [];
        req.session.quizzesPorJugar = [];
        req.session.idsAzar = [];
        res.render('quizzes/random_result', {
            score,
            answer,
            result
        });
    }
};

