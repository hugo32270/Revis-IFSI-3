import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  BookOpen,
  Brain,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  Clock3,
  Flame,
  GraduationCap,
  HeartPulse,
  Home,
  LibraryBig,
  Moon,
  RotateCcw,
  Search,
  Settings,
  Sparkles,
  Star,
  Sun,
  Target,
  Trophy,
  X,
} from "lucide-react";

import { ueData } from "./data/ues.js";

import {
  allQuestions,
  getQuestionCountByUE,
  getQuestionsByUE,
  getRandomQuestions,
} from "./data/questions.js";

/* =========================================================
   COMPOSANTS DE BASE
   ========================================================= */

function Card({ children, className = "", onClick }) {
  return (
    <div
      onClick={onClick}
      className={`rounded-3xl bg-white dark:bg-slate-900 ${className}`}
    >
      {children}
    </div>
  );
}

function Button({
  children,
  onClick,
  variant = "primary",
  className = "",
  disabled = false,
  type = "button",
}) {
  const variants = {
    primary:
      "bg-teal-600 text-white hover:bg-teal-700 dark:bg-teal-600 dark:hover:bg-teal-500",

    secondary:
      "bg-slate-100 text-slate-800 hover:bg-slate-200 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700",

    outline:
      "border-2 border-slate-300 bg-white text-slate-800 hover:border-teal-500 hover:bg-teal-50 dark:border-slate-600 dark:bg-slate-900 dark:text-white dark:hover:border-teal-500 dark:hover:bg-slate-800",

    ghost:
      "bg-transparent text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800",

    white:
      "border border-white/40 bg-white text-teal-700 shadow-sm hover:bg-cyan-50 hover:text-teal-800",

    danger:
      "border-2 border-rose-300 bg-white text-rose-600 hover:bg-rose-50 dark:border-rose-800 dark:bg-slate-900 dark:text-rose-400 dark:hover:bg-rose-950",
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center justify-center font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

function Badge({ children, variant = "primary", className = "" }) {
  const variants = {
    primary:
      "bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300",

    secondary:
      "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",

    outline:
      "border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-300",

    white: "border border-white/20 bg-white/15 text-white",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}

function Progress({ value = 0, className = "" }) {
  const safeValue = Math.min(100, Math.max(0, value));

  return (
    <div
      className={`h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700 ${className}`}
    >
      <div
        className="h-full rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 transition-all duration-500"
        style={{
          width: `${safeValue}%`,
        }}
      />
    </div>
  );
}

function StatCard({ icon: Icon, label, value, accent }) {
  return (
    <Card className="border border-slate-100 p-4 shadow-sm dark:border-slate-800">
      <div className="flex items-center gap-3">
        <div className={`rounded-2xl p-3 ${accent}`}>
          <Icon className="h-5 w-5" />
        </div>

        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {label}
          </p>

          <p className="text-lg font-bold">{value}</p>
        </div>
      </div>
    </Card>
  );
}

/* =========================================================
   FONCTIONS DE SAUVEGARDE LOCALE
   ========================================================= */

function readLocalStorage(key, fallbackValue) {
  try {
    const savedValue = localStorage.getItem(key);

    if (savedValue === null) {
      return fallbackValue;
    }

    return JSON.parse(savedValue);
  } catch {
    return fallbackValue;
  }
}

function normalizeAnswer(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/^(un|une|le|la|les|l')\s+/i, "")
    .replace(/\s+/g, " ");
}

function MultiFormatQuestion({ question, resolved, onResolve }) {
  const type = question.type || "single";
  const [singleChoice, setSingleChoice] = useState(null);
  const [multipleChoices, setMultipleChoices] = useState([]);
  const [textValue, setTextValue] = useState("");
  const [numberValue, setNumberValue] = useState("");
  const [orderedItems, setOrderedItems] = useState(() => [...(question.items || [])]);
  const [matches, setMatches] = useState({});
  const [caseStep, setCaseStep] = useState(0);
  const [caseChoice, setCaseChoice] = useState(null);
  const [caseCorrect, setCaseCorrect] = useState(true);
  const [caseFeedback, setCaseFeedback] = useState("");

  function submitSingle(index) {
    if (resolved) return;
    setSingleChoice(index);
    onResolve(index === question.answer);
  }

  function toggleMultiple(index) {
    if (resolved) return;
    setMultipleChoices((values) =>
      values.includes(index) ? values.filter((value) => value !== index) : [...values, index],
    );
  }

  function submitMultiple() {
    const selected = [...multipleChoices].sort((a, b) => a - b);
    const expected = [...(question.answers || [])].sort((a, b) => a - b);
    onResolve(JSON.stringify(selected) === JSON.stringify(expected));
  }

  function submitText() {
    const entered = normalizeAnswer(textValue);
    const accepted = (question.acceptedAnswers || []).map(normalizeAnswer);
    onResolve(entered !== "" && accepted.includes(entered));
  }

  function submitCalculation() {
    const entered = Number(String(numberValue).replace(",", "."));
    const tolerance = Number(question.tolerance || 0);
    onResolve(Number.isFinite(entered) && Math.abs(entered - Number(question.expectedValue)) <= tolerance);
  }

  function moveItem(index, direction) {
    if (resolved) return;
    const target = index + direction;
    if (target < 0 || target >= orderedItems.length) return;
    setOrderedItems((items) => {
      const copy = [...items];
      [copy[index], copy[target]] = [copy[target], copy[index]];
      return copy;
    });
  }

  function submitOrdering() {
    onResolve(JSON.stringify(orderedItems) === JSON.stringify(question.correctOrder || []));
  }

  function submitMatching() {
    const pairs = question.pairs || [];
    const correct = pairs.every((pair, index) => matches[index] === pair.right);
    onResolve(correct);
  }

  function submitCaseChoice(index) {
    if (caseChoice !== null || resolved) return;
    const step = question.steps[caseStep];
    const correct = index === step.answer;
    setCaseChoice(index);
    setCaseFeedback(step.explanation);
    setCaseCorrect((value) => value && correct);
  }

  function nextCaseStep() {
    if (caseStep < question.steps.length - 1) {
      setCaseStep((value) => value + 1);
      setCaseChoice(null);
      setCaseFeedback("");
    } else {
      const finalStepCorrect = caseChoice === question.steps[caseStep].answer;
      onResolve(caseCorrect && finalStepCorrect);
    }
  }

  const baseChoice = "flex w-full items-center gap-3 rounded-2xl border-2 p-4 text-left transition";
  const neutralChoice = "border-slate-200 hover:border-teal-400 hover:bg-teal-50/40 dark:border-slate-700 dark:hover:bg-slate-800";

  return (
    <>
      <div className="mt-5 rounded-2xl bg-violet-50 px-4 py-3 text-sm font-semibold text-violet-700 dark:bg-violet-950 dark:text-violet-300">
        {type === "multiple" && "Plusieurs réponses sont attendues."}
        {type === "true-false" && "Indique si cette affirmation est vraie ou fausse."}
        {type === "text" && "Saisis une réponse courte."}
        {type === "ordering" && "Replace les éléments dans le bon ordre."}
        {type === "matching" && "Associe chaque notion à sa définition."}
        {type === "calculation" && "Saisis uniquement la valeur numérique demandée."}
        {type === "clinical-case" && "Cas clinique progressif."}
        {type === "single" && "Une seule réponse est attendue."}
      </div>

      {type === "clinical-case" && question.title && (
        <div className="mt-5 rounded-2xl bg-slate-100 p-4 dark:bg-slate-800">
          <p className="font-bold">{question.title}</p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{question.introduction}</p>
        </div>
      )}

      <h2 className="mt-6 text-xl font-black leading-relaxed md:text-2xl">
        {type === "clinical-case" ? question.steps[caseStep].question : question.question}
      </h2>

      {(type === "single" || type === "true-false") && (
        <div className={`mt-6 ${type === "true-false" ? "grid grid-cols-2 gap-3" : "space-y-3"}`}>
          {question.choices.map((choice, index) => {
            let style = neutralChoice;
            if (resolved && index === question.answer) style = "border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200";
            else if (resolved && singleChoice === index) style = "border-rose-500 bg-rose-50 text-rose-800 dark:bg-rose-950 dark:text-rose-200";
            return (
              <button type="button" key={index} disabled={resolved} onClick={() => submitSingle(index)}
                className={`${baseChoice} ${type === "true-false" ? "justify-center text-center font-bold" : ""} ${style}`}>
                {type !== "true-false" && <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-100 font-bold dark:bg-slate-800">{String.fromCharCode(65 + index)}</span>}
                <span>{choice}</span>
              </button>
            );
          })}
        </div>
      )}

      {type === "multiple" && (
        <div className="mt-6 space-y-3">
          {question.choices.map((choice, index) => {
            const selected = multipleChoices.includes(index);
            const correct = (question.answers || []).includes(index);
            let style = selected ? "border-teal-500 bg-teal-50 dark:bg-teal-950" : neutralChoice;
            if (resolved && correct) style = "border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200";
            else if (resolved && selected && !correct) style = "border-rose-500 bg-rose-50 text-rose-800 dark:bg-rose-950 dark:text-rose-200";
            return <button type="button" key={index} disabled={resolved} onClick={() => toggleMultiple(index)} className={`${baseChoice} ${style}`}><span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border-2">{selected ? "✓" : ""}</span><span>{choice}</span></button>;
          })}
          {!resolved && <Button onClick={submitMultiple} disabled={!multipleChoices.length} className="w-full rounded-2xl px-5 py-3">Valider mes réponses</Button>}
        </div>
      )}

      {type === "text" && (
        <div className="mt-6 space-y-3"><input value={textValue} disabled={resolved} onChange={(event) => setTextValue(event.target.value)} placeholder="Ta réponse..." className="w-full rounded-2xl border-2 border-slate-200 bg-white p-4 outline-none focus:border-teal-500 dark:border-slate-700 dark:bg-slate-900" />{!resolved && <Button onClick={submitText} disabled={!textValue.trim()} className="w-full rounded-2xl px-5 py-3">Valider ma réponse</Button>}</div>
      )}

      {type === "calculation" && (
        <div className="mt-6 space-y-3"><div className="flex items-center gap-3"><input type="number" inputMode="decimal" value={numberValue} disabled={resolved} onChange={(event) => setNumberValue(event.target.value)} placeholder="Résultat" className="min-w-0 flex-1 rounded-2xl border-2 border-slate-200 bg-white p-4 outline-none focus:border-teal-500 dark:border-slate-700 dark:bg-slate-900" /><span className="font-bold">{question.unit}</span></div>{!resolved && <Button onClick={submitCalculation} disabled={numberValue === ""} className="w-full rounded-2xl px-5 py-3">Valider le calcul</Button>}</div>
      )}

      {type === "ordering" && (
        <div className="mt-6 space-y-3">{orderedItems.map((item, index) => <div key={item} className="flex items-center gap-3 rounded-2xl border-2 border-slate-200 p-3 dark:border-slate-700"><span className="grid h-8 w-8 place-items-center rounded-full bg-slate-100 font-bold dark:bg-slate-800">{index + 1}</span><span className="min-w-0 flex-1">{item}</span><button disabled={resolved || index === 0} onClick={() => moveItem(index, -1)} className="rounded-xl border px-3 py-2 disabled:opacity-30">↑</button><button disabled={resolved || index === orderedItems.length - 1} onClick={() => moveItem(index, 1)} className="rounded-xl border px-3 py-2 disabled:opacity-30">↓</button></div>)}{!resolved && <Button onClick={submitOrdering} className="w-full rounded-2xl px-5 py-3">Valider l’ordre</Button>}</div>
      )}

      {type === "matching" && (
        <div className="mt-6 space-y-3">{(question.pairs || []).map((pair, index) => <div key={pair.left} className="rounded-2xl border-2 border-slate-200 p-4 dark:border-slate-700"><p className="mb-2 font-bold">{pair.left}</p><select disabled={resolved} value={matches[index] || ""} onChange={(event) => setMatches((values) => ({ ...values, [index]: event.target.value }))} className="w-full rounded-xl border bg-white p-3 dark:border-slate-700 dark:bg-slate-900"><option value="">Choisir une définition</option>{question.pairs.map((option) => <option key={option.right} value={option.right}>{option.right}</option>)}</select></div>)}{!resolved && <Button onClick={submitMatching} disabled={Object.keys(matches).length !== question.pairs.length} className="w-full rounded-2xl px-5 py-3">Valider les associations</Button>}</div>
      )}

      {type === "clinical-case" && (
        <div className="mt-6 space-y-3">
          <p className="text-sm font-semibold text-slate-500">Étape {caseStep + 1} sur {question.steps.length}</p>
          {question.steps[caseStep].choices.map((choice, index) => {
            let style = neutralChoice;
            if (caseChoice !== null && index === question.steps[caseStep].answer) style = "border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200";
            else if (caseChoice === index) style = "border-rose-500 bg-rose-50 text-rose-800 dark:bg-rose-950 dark:text-rose-200";
            return <button type="button" key={index} disabled={caseChoice !== null || resolved} onClick={() => submitCaseChoice(index)} className={`${baseChoice} ${style}`}><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-100 font-bold dark:bg-slate-800">{String.fromCharCode(65 + index)}</span><span>{choice}</span></button>;
          })}
          {caseChoice !== null && !resolved && <><div className="rounded-2xl bg-blue-50 p-4 text-sm text-blue-900 dark:bg-blue-950 dark:text-blue-100">{caseFeedback}</div><Button onClick={nextCaseStep} className="w-full rounded-2xl px-5 py-3">{caseStep === question.steps.length - 1 ? "Terminer le cas" : "Étape suivante"}</Button></>}
        </div>
      )}

      {resolved && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 rounded-2xl bg-blue-50 p-4 text-sm text-blue-900 dark:bg-blue-950 dark:text-blue-100">
          <p className="font-bold">Explication</p><p className="mt-1 leading-relaxed">{question.explanation}</p>
          {type === "text" && <p className="mt-2 font-semibold">Réponse attendue : {(question.acceptedAnswers || []).join(" / ")}</p>}
          {type === "calculation" && <p className="mt-2 font-semibold">Réponse attendue : {question.expectedValue} {question.unit}</p>}
          {type === "ordering" && <ol className="mt-2 list-inside list-decimal">{(question.correctOrder || []).map((item) => <li key={item}>{item}</li>)}</ol>}
          {question.source && <p className="mt-3 border-t border-blue-200 pt-3 text-xs text-blue-700 dark:border-blue-800 dark:text-blue-300">Source : {question.source}</p>}
        </motion.div>
      )}
    </>
  );
}


/* =========================================================
   APPLICATION
   ========================================================= */

export default function App() {
  const [page, setPage] = useState("home");
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [semester, setSemester] = useState(5);
  const [search, setSearch] = useState("");
  const [selectedUE, setSelectedUE] = useState(null);

  const [quizQuestions, setQuizQuestions] = useState([]);
  const [activeQuizUE, setActiveQuizUE] = useState(null);

  const [quizActive, setQuizActive] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [score, setScore] = useState(0);

  const [darkMode, setDarkMode] = useState(() =>
    readLocalStorage("revis-ifsi-dark-mode", false),
  );

  const [favorites, setFavorites] = useState(() =>
    readLocalStorage("revis-ifsi-favorites", []),
  );

  const [history, setHistory] = useState(() =>
    readLocalStorage("revis-ifsi-history", []),
  );

  const [wrongQuestionIds, setWrongQuestionIds] = useState(() =>
    readLocalStorage("revis-ifsi-wrong-questions", []),
  );

  const currentQuestion =
    quizQuestions.length > 0
      ? quizQuestions[questionIndex]
      : null;

  /* =======================================================
     DONNÉES CALCULÉES
     ======================================================= */

  const filteredUEs = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return ueData.filter((ue) => {
      const matchesSemester = ue.semester === semester;

      const matchesSearch =
        normalizedSearch === "" ||
        `${ue.id} ${ue.title}`
          .toLowerCase()
          .includes(normalizedSearch);

      return matchesSemester && matchesSearch;
    });
  }, [semester, search]);

  const totalAnswered = history.reduce(
    (total, attempt) => total + attempt.total,
    0,
  );

  const totalCorrect = history.reduce(
    (total, attempt) => total + attempt.score,
    0,
  );

  const averageScore =
    totalAnswered > 0
      ? Math.round((totalCorrect / totalAnswered) * 100)
      : 0;

  const workedUEs = new Set(
    history
      .map((attempt) => attempt.ue)
      .filter((ue) => ue && ue !== "Quiz général"),
  ).size;

  /* =======================================================
     SAUVEGARDE LOCALE
     ======================================================= */

  useEffect(() => {
    localStorage.setItem(
      "revis-ifsi-dark-mode",
      JSON.stringify(darkMode),
    );

    document.documentElement.classList.toggle(
      "dark",
      darkMode,
    );
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem(
      "revis-ifsi-favorites",
      JSON.stringify(favorites),
    );
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem(
      "revis-ifsi-history",
      JSON.stringify(history),
    );
  }, [history]);

  useEffect(() => {
    localStorage.setItem(
      "revis-ifsi-wrong-questions",
      JSON.stringify(wrongQuestionIds),
    );
  }, [wrongQuestionIds]);

  /* =======================================================
     NAVIGATION
     ======================================================= */
function goBack() {
  /*
  Si les paramètres sont ouverts, le bouton Retour ferme
  simplement la fenêtre des paramètres.
  */

  if (settingsOpen) {
    setSettingsOpen(false);
    return;
  }

  /*
  Si un quiz est en cours ou terminé, retour à l’écran
  principal des quiz.
  */

  if (page === "quiz" && (quizActive || quizFinished)) {
    setQuizActive(false);
    setQuizFinished(false);
    setQuestionIndex(0);
    setSelectedAnswer(null);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });

    return;
  }

  /*
  Si une UE est ouverte, retour à la liste des UE.
  */

  if (page === "ues" && selectedUE) {
    setSelectedUE(null);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });

    return;
  }

  /*
  Depuis les pages Quiz, Progression ou Mes UE,
  retour vers l’accueil.
  */

  if (page !== "home") {
    navigateTo("home");
    return;
  }

  /*
  Si l’utilisatrice est déjà sur l’accueil, on remonte
  simplement en haut de la page.
  */

  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
}
  function navigateTo(newPage) {
    setPage(newPage);

    if (newPage !== "quiz") {
      setQuizActive(false);
      setQuizFinished(false);
    }

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function selectUE(ue) {
    setSelectedUE(ue);
    setSemester(ue.semester);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  /* =======================================================
     QUIZ
     ======================================================= */

  function startQuiz(ueId = null, amount = 5) {
    let availableQuestions = allQuestions;

    if (ueId) {
      availableQuestions = getQuestionsByUE(ueId);
    }

    if (availableQuestions.length === 0) {
      window.alert(
        "Aucune question n’est encore disponible pour cette UE.",
      );

      return;
    }

    const selectedQuestions = getRandomQuestions(
      availableQuestions,
      amount,
    );

    setQuizQuestions(selectedQuestions);
    setActiveQuizUE(ueId);

    setPage("quiz");
    setQuizActive(true);
    setQuizFinished(false);

    setQuestionIndex(0);
    setSelectedAnswer(null);
    setScore(0);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function resolveCurrentQuestion(isCorrect) {
    if (selectedAnswer !== null || !currentQuestion) return;
    setSelectedAnswer(isCorrect ? "correct" : "incorrect");
    if (isCorrect) {
      setScore((currentScore) => currentScore + 1);
      setWrongQuestionIds((currentIds) => currentIds.filter((id) => id !== currentQuestion.id));
    } else {
      setWrongQuestionIds((currentIds) => currentIds.includes(currentQuestion.id) ? currentIds : [...currentIds, currentQuestion.id]);
    }
  }

  function answerQuestion(answerIndex) {
    if (
      selectedAnswer !== null ||
      !currentQuestion
    ) {
      return;
    }

    setSelectedAnswer(answerIndex);

    const isCorrect =
      answerIndex === currentQuestion.answer;

    if (isCorrect) {
      setScore((currentScore) => currentScore + 1);

      setWrongQuestionIds((currentIds) =>
        currentIds.filter(
          (id) => id !== currentQuestion.id,
        ),
      );
    } else {
      setWrongQuestionIds((currentIds) => {
        if (currentIds.includes(currentQuestion.id)) {
          return currentIds;
        }

        return [
          ...currentIds,
          currentQuestion.id,
        ];
      });
    }
  }

  function nextQuestion() {
    if (!currentQuestion) {
      return;
    }

    const isLastQuestion =
      questionIndex === quizQuestions.length - 1;

    if (!isLastQuestion) {
      setQuestionIndex(
        (currentIndex) => currentIndex + 1,
      );

      setSelectedAnswer(null);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      return;
    }

    const historyEntry = {
      id: Date.now(),
      ue: activeQuizUE || "Quiz général",
      score,
      total: quizQuestions.length,
      date: new Date().toISOString(),
    };

    setHistory((currentHistory) => [
      historyEntry,
      ...currentHistory,
    ]);

    setQuizActive(false);
    setQuizFinished(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function toggleFavorite() {
    if (!currentQuestion) {
      return;
    }

    const questionId = currentQuestion.id;

    setFavorites((currentFavorites) => {
      if (currentFavorites.includes(questionId)) {
        return currentFavorites.filter(
          (id) => id !== questionId,
        );
      }

      return [
        ...currentFavorites,
        questionId,
      ];
    });
  }

  function startErrorsQuiz() {
    const wrongQuestions = allQuestions.filter(
      (question) =>
        wrongQuestionIds.includes(question.id),
    );

    if (wrongQuestions.length === 0) {
      window.alert(
        "Tu n’as actuellement aucune erreur à revoir.",
      );

      return;
    }

    const selectedQuestions = getRandomQuestions(
      wrongQuestions,
      Math.min(10, wrongQuestions.length),
    );

    setQuizQuestions(selectedQuestions);
    setActiveQuizUE("Erreurs à revoir");

    setPage("quiz");
    setQuizActive(true);
    setQuizFinished(false);

    setQuestionIndex(0);
    setSelectedAnswer(null);
    setScore(0);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function startFavoritesQuiz() {
    const favoriteQuestions = allQuestions.filter(
      (question) =>
        favorites.includes(question.id),
    );

    if (favoriteQuestions.length === 0) {
      window.alert(
        "Tu n’as encore ajouté aucune question aux favoris.",
      );

      return;
    }

    const selectedQuestions = getRandomQuestions(
      favoriteQuestions,
      Math.min(10, favoriteQuestions.length),
    );

    setQuizQuestions(selectedQuestions);
    setActiveQuizUE("Favoris");

    setPage("quiz");
    setQuizActive(true);
    setQuizFinished(false);

    setQuestionIndex(0);
    setSelectedAnswer(null);
    setScore(0);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  /* =======================================================
     NAVIGATION MOBILE
     ======================================================= */

  const navigation = [
    {
      id: "home",
      label: "Accueil",
      icon: Home,
    },
    {
      id: "ues",
      label: "Mes UE",
      icon: LibraryBig,
    },
    {
      id: "quiz",
      label: "Quiz",
      icon: Brain,
    },
    {
      id: "progress",
      label: "Progression",
      icon: Trophy,
    },
  ];
  const mobilePageTitle = (() => {
  if (page === "home") {
    return "Accueil";
  }

  if (page === "ues" && selectedUE) {
    return `UE ${selectedUE.id}`;
  }

  if (page === "ues") {
    return "Mes UE";
  }

  if (page === "quiz" && quizActive) {
    return "Quiz en cours";
  }

  if (page === "quiz" && quizFinished) {
    return "Résultat";
  }

  if (page === "quiz") {
    return "Entraînements";
  }

  if (page === "progress") {
    return "Ma progression";
  }

  return "Révis’IFSI 3";
})();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
      {/* ===================================================
          EN-TÊTE
          =================================================== */}

      <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <button
            type="button"
            onClick={() => navigateTo("home")}
            className="flex items-center gap-3"
          >
            <div className="rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 p-2.5 text-white shadow-lg shadow-teal-500/20">
              <HeartPulse className="h-6 w-6" />
            </div>

            <div className="text-left">
              <h1 className="font-black tracking-tight">
                Révis&apos;IFSI 3
              </h1>

              <p className="text-xs text-slate-500 dark:text-slate-400">
                Semestres 5 et 6
              </p>
            </div>
          </button>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={() =>
                setDarkMode((current) => !current)
              }
              className="h-10 w-10 rounded-xl p-0"
            >
              {darkMode ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>

            <Button
  variant="ghost"
  onClick={() => setSettingsOpen(true)}
  className="h-10 w-10 rounded-xl p-0"
>
  <Settings className="h-5 w-5" />
</Button>
          </div>
        </div>
      </header>

      {/* NAVIGATION SUPÉRIEURE POUR TÉLÉPHONE */}

<div className="sticky top-[65px] z-20 border-b border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-950 md:hidden">
  <div className="mx-auto flex max-w-md items-center gap-2">
    {/* RETOUR */}

    <button
      type="button"
      onClick={goBack}
      className="flex h-11 shrink-0 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 font-semibold text-slate-700 shadow-sm transition active:scale-95 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
      aria-label="Retour"
    >
      <ArrowLeft className="h-5 w-5" />
      <span className="hidden sm:inline">
        Retour
      </span>
    </button>

    {/* TITRE */}

    <div className="min-w-0 flex-1 text-center">
      <p className="truncate text-sm font-bold">
        {mobilePageTitle}
      </p>

      {page === "quiz" && quizActive && (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Question {questionIndex + 1} sur {quizQuestions.length}
        </p>
      )}
    </div>

    {/* ACCUEIL */}

    <button
      type="button"
      onClick={() => navigateTo("home")}
      className={`flex h-11 shrink-0 items-center justify-center gap-2 rounded-2xl border px-3 font-semibold shadow-sm transition active:scale-95 ${
        page === "home"
          ? "border-teal-600 bg-teal-600 text-white"
          : "border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
      }`}
      aria-label="Accueil"
    >
      <Home className="h-5 w-5" />
      <span className="hidden sm:inline">
        Accueil
      </span>
    </button>
  </div>
</div>

      {/* ===================================================
          CONTENU PRINCIPAL
          =================================================== */}

      <main className="mx-auto max-w-6xl px-4 pb-28 pt-6 md:pb-10">
        <AnimatePresence mode="wait">
          {/* =================================================
              ACCUEIL
              ================================================= */}

          {page === "home" && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-teal-600 via-cyan-600 to-blue-700 p-6 text-white shadow-xl shadow-cyan-600/15 md:p-9">
                <div className="grid items-center gap-8 md:grid-cols-[1.4fr_0.6fr]">
                  <div>
                    <Badge
                      variant="white"
                      className="mb-4"
                    >
                      Troisième année IFSI
                    </Badge>

                    <h2 className="max-w-xl text-3xl font-black tracking-tight md:text-5xl">
                      Prête pour une révision rapide ?
                    </h2>

                    <p className="mt-3 max-w-xl text-cyan-50">
                      Continue ta progression, révise tes
                      erreurs et prépare tes évaluations UE
                      après UE.
                    </p>

                    <div className="mt-6 flex flex-wrap gap-3">
                      <Button
  variant="white"
  onClick={() => startQuiz(null, 5)}
  className="rounded-2xl px-5 py-3"
>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Quiz du jour
                      </Button>

                      <button
                        type="button"
                        onClick={() => navigateTo("ues")}
                        className="inline-flex items-center justify-center rounded-2xl border border-white/40 bg-white/10 px-5 py-3 font-semibold text-white transition hover:bg-white/20"
                      >
                        <BookOpen className="mr-2 h-4 w-4" />
                        Voir mes UE
                      </button>
                    </div>
                  </div>

                  <div className="hidden justify-center md:flex">
                    <div className="grid h-44 w-44 place-items-center rounded-full border-[14px] border-white/20">
                      <div className="text-center">
                        <p className="text-4xl font-black">
                          {averageScore} %
                        </p>

                        <p className="text-xs text-cyan-100">
                          réussite globale
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <StatCard
                  icon={Flame}
                  label="Quiz terminés"
                  value={history.length}
                  accent="bg-orange-100 text-orange-600 dark:bg-orange-950"
                />

                <StatCard
                  icon={CircleCheck}
                  label="Questions faites"
                  value={totalAnswered}
                  accent="bg-teal-100 text-teal-600 dark:bg-teal-950"
                />

                <StatCard
                  icon={Target}
                  label="Réussite"
                  value={`${averageScore} %`}
                  accent="bg-blue-100 text-blue-600 dark:bg-blue-950"
                />

                <StatCard
                  icon={RotateCcw}
                  label="Erreurs à revoir"
                  value={wrongQuestionIds.length}
                  accent="bg-rose-100 text-rose-600 dark:bg-rose-950"
                />
              </section>

              <section className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
                <Card className="border border-slate-100 p-5 shadow-sm dark:border-slate-800 md:p-6">
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold">
                        UE disponibles
                      </h3>

                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Commence tes premières révisions
                      </p>
                    </div>

                    <Button
                      variant="ghost"
                      onClick={() => navigateTo("ues")}
                      className="rounded-xl px-3 py-2"
                    >
                      Tout voir
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {ueData
                      .filter(
                        (ue) =>
                          ue.semester === 5 &&
                          getQuestionCountByUE(ue.id) > 0,
                      )
                      .slice(0, 3)
                      .map((ue) => {
                        const questionCount =
                          getQuestionCountByUE(ue.id);

                        return (
                          <button
                            type="button"
                            key={ue.id}
                            onClick={() => {
                              selectUE(ue);
                              navigateTo("ues");
                            }}
                            className="flex w-full items-center gap-4 rounded-2xl border border-slate-100 p-3 text-left transition hover:border-teal-200 hover:bg-teal-50/50 dark:border-slate-800 dark:hover:border-teal-800 dark:hover:bg-slate-800"
                          >
                            <div
                              className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${ue.color} font-bold text-white`}
                            >
                              {ue.id.split(".")[0]}
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="font-semibold">
                                UE {ue.id}
                              </p>

                              <p className="truncate text-sm text-slate-500 dark:text-slate-400">
                                {ue.title}
                              </p>

                              <p className="mt-1 text-xs text-teal-600 dark:text-teal-400">
                                {questionCount} question
                                {questionCount > 1 ? "s" : ""}{" "}
                                disponible
                                {questionCount > 1 ? "s" : ""}
                              </p>
                            </div>

                            <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" />
                          </button>
                        );
                      })}

                    {allQuestions.length === 0 && (
                      <div className="rounded-2xl bg-slate-100 p-5 text-center dark:bg-slate-800">
                        <p className="font-semibold">
                          Aucune question disponible
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          Ajoute des questions dans
                          src/data/questions.js.
                        </p>
                      </div>
                    )}
                  </div>
                </Card>

                <Card className="border border-slate-100 p-5 shadow-sm dark:border-slate-800 md:p-6">
                  <h3 className="flex items-center gap-2 text-xl font-bold">
                    <CalendarDays className="h-5 w-5 text-teal-600" />
                    Banque de questions
                  </h3>

                  <div className="mt-5 rounded-2xl bg-slate-100 p-5 dark:bg-slate-800">
                    <Badge>
                      Données locales
                    </Badge>

                    <h4 className="mt-3 text-3xl font-black">
                      {allQuestions.length}
                    </h4>

                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      question
                      {allQuestions.length > 1 ? "s" : ""}{" "}
                      dans l’application
                    </p>
                  </div>

                  <Button
                    onClick={() => navigateTo("quiz")}
                    className="mt-4 w-full rounded-2xl px-4 py-3"
                  >
                    Voir les entraînements
                  </Button>
                </Card>
              </section>
            </motion.div>
          )}

          {/* =================================================
              MES UE
              ================================================= */}

          {page === "ues" && (
            <motion.div
              key="ues"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-3xl font-black">
                  Mes unités d&apos;enseignement
                </h2>

                <p className="mt-1 text-slate-500 dark:text-slate-400">
                  Révise par semestre et par UE.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="inline-flex rounded-2xl bg-slate-200 p-1 dark:bg-slate-800">
                  {[5, 6].map((selectedSemester) => (
                    <button
                      type="button"
                      key={selectedSemester}
                      onClick={() => {
                        setSemester(selectedSemester);
                        setSelectedUE(null);
                      }}
                      className={`rounded-xl px-5 py-2 text-sm font-semibold transition ${
                        semester === selectedSemester
                          ? "bg-white text-teal-700 shadow-sm dark:bg-slate-700 dark:text-teal-300"
                          : "text-slate-500 dark:text-slate-400"
                      }`}
                    >
                      Semestre {selectedSemester}
                    </button>
                  ))}
                </div>

                <div className="relative sm:w-80">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />

                  <input
                    type="search"
                    value={search}
                    onChange={(event) =>
                      setSearch(event.target.value)
                    }
                    placeholder="Rechercher une UE..."
                    className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 dark:border-slate-700 dark:bg-slate-900"
                  />
                </div>
              </div>

              {selectedUE && (
                <Card className="bg-gradient-to-r from-teal-600 to-cyan-600 p-6 text-white shadow-lg">
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <button
                        type="button"
                        onClick={() => setSelectedUE(null)}
                        className="mb-3 flex items-center text-sm text-cyan-100 transition hover:text-white"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Retour à la liste
                      </button>

                      <Badge variant="white">
                        UE {selectedUE.id}
                      </Badge>

                      <h3 className="mt-3 text-2xl font-black">
                        {selectedUE.title}
                      </h3>

                      <p className="mt-2 text-cyan-50">
                        {getQuestionCountByUE(selectedUE.id)}{" "}
                        question
                        {getQuestionCountByUE(selectedUE.id) >
                        1
                          ? "s"
                          : ""}{" "}
                        disponible
                        {getQuestionCountByUE(selectedUE.id) >
                        1
                          ? "s"
                          : ""}
                      </p>
                    </div>

                    <Button
  variant="white"
  onClick={() => startQuiz(selectedUE.id, 5)}
  disabled={getQuestionCountByUE(selectedUE.id) === 0}
  className="rounded-2xl px-5 py-3"
>
                      Commencer un quiz
                    </Button>
                  </div>
                </Card>
              )}

              {filteredUEs.length === 0 ? (
                <Card className="p-10 text-center shadow-sm">
                  <Search className="mx-auto h-10 w-10 text-slate-400" />

                  <h3 className="mt-4 text-lg font-bold">
                    Aucune UE trouvée
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Essaie une autre recherche.
                  </p>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {filteredUEs.map((ue) => {
                    const questionCount =
                      getQuestionCountByUE(ue.id);

                    return (
                      <motion.button
                        layout
                        type="button"
                        key={ue.id}
                        onClick={() => selectUE(ue)}
                        className="text-left"
                      >
                        <Card className="h-full border border-slate-100 p-5 shadow-sm transition hover:-translate-y-1 hover:border-teal-200 hover:shadow-lg dark:border-slate-800 dark:hover:border-teal-800">
                          <div className="flex items-start justify-between gap-3">
                            <div
                              className={`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${ue.color} font-black text-white`}
                            >
                              {ue.id.split(".")[0]}
                            </div>

                            <Badge
                              variant={
                                questionCount > 0
                                  ? "primary"
                                  : "secondary"
                              }
                            >
                              {questionCount} question
                              {questionCount > 1 ? "s" : ""}
                            </Badge>
                          </div>

                          <p className="mt-4 text-sm font-bold text-teal-600 dark:text-teal-400">
                            UE {ue.id}
                          </p>

                          <h3 className="mt-1 min-h-12 font-bold leading-snug">
                            {ue.title}
                          </h3>

                          <div className="mt-5 flex items-center justify-between text-sm">
                            <span className="text-slate-500 dark:text-slate-400">
                              {questionCount > 0
                                ? "Commencer"
                                : "Bientôt disponible"}
                            </span>

                            <ChevronRight className="h-5 w-5 text-teal-600" />
                          </div>
                        </Card>
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* =================================================
              QUIZ
              ================================================= */}

          {page === "quiz" && (
            <motion.div
              key="quiz"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mx-auto max-w-3xl"
            >
              {!quizActive && !quizFinished && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-3xl font-black">
                      Quiz et entraînements
                    </h2>

                    <p className="mt-1 text-slate-500 dark:text-slate-400">
                      Choisis ton mode de révision.
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => startQuiz(null, 5)}
                      disabled={allQuestions.length === 0}
                      className="text-left disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Card className="h-full bg-gradient-to-br from-teal-500 to-cyan-600 p-6 text-white shadow-lg transition hover:-translate-y-1">
                        <Sparkles className="h-8 w-8" />

                        <h3 className="mt-5 text-2xl font-black">
                          Quiz express
                        </h3>

                        <p className="mt-2 text-cyan-50">
                          Jusqu’à 5 questions choisies parmi
                          toutes les UE disponibles.
                        </p>

                        <span className="mt-6 inline-flex rounded-2xl bg-white px-5 py-2.5 font-semibold text-teal-700">
                          Commencer
                        </span>
                      </Card>
                    </button>

                    <Card className="border border-slate-100 p-6 shadow-sm dark:border-slate-800">
                      <RotateCcw className="h-8 w-8 text-rose-500" />

                      <h3 className="mt-5 text-2xl font-black">
                        Mes erreurs
                      </h3>

                      <p className="mt-2 text-slate-500 dark:text-slate-400">
                        {wrongQuestionIds.length} question
                        {wrongQuestionIds.length > 1
                          ? "s"
                          : ""}{" "}
                        à revoir.
                      </p>

                      <Button
                        variant="outline"
                        onClick={startErrorsQuiz}
                        disabled={
                          wrongQuestionIds.length === 0
                        }
                        className="mt-6 rounded-2xl px-5 py-2.5"
                      >
                        Réviser mes erreurs
                      </Button>
                    </Card>

                    <Card className="border border-slate-100 p-6 shadow-sm dark:border-slate-800">
                      <Clock3 className="h-8 w-8 text-blue-500" />

                      <h3 className="mt-5 text-2xl font-black">
                        Examen blanc
                      </h3>

                      <p className="mt-2 text-slate-500 dark:text-slate-400">
                        Lance un quiz pouvant contenir jusqu’à
                        20 questions.
                      </p>

                      <Button
                        variant="outline"
                        onClick={() => startQuiz(null, 20)}
                        disabled={allQuestions.length === 0}
                        className="mt-6 rounded-2xl px-5 py-2.5"
                      >
                        Lancer l’examen
                      </Button>
                    </Card>

                    <Card className="border border-slate-100 p-6 shadow-sm dark:border-slate-800">
                      <Star className="h-8 w-8 text-amber-500" />

                      <h3 className="mt-5 text-2xl font-black">
                        Mes favoris
                      </h3>

                      <p className="mt-2 text-slate-500 dark:text-slate-400">
                        {favorites.length} question
                        {favorites.length > 1
                          ? "s"
                          : ""}{" "}
                        enregistrée
                        {favorites.length > 1 ? "s" : ""}.
                      </p>

                      <Button
                        variant="outline"
                        onClick={startFavoritesQuiz}
                        disabled={favorites.length === 0}
                        className="mt-6 rounded-2xl px-5 py-2.5"
                      >
                        Réviser mes favoris
                      </Button>
                    </Card>
                  </div>
                </div>
              )}

              {quizActive &&
                !quizFinished &&
                currentQuestion && (
                  <div className="space-y-5">
                    <div className="flex items-center justify-between">
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setQuizActive(false);
                          setQuizFinished(false);
                        }}
                        className="rounded-xl px-3 py-2"
                      >
                        <X className="mr-2 h-4 w-4" />
                        Quitter
                      </Button>

                      <span className="text-sm font-semibold">
                        Question {questionIndex + 1}/
                        {quizQuestions.length}
                      </span>
                    </div>

                    <Progress
                      value={
                        ((questionIndex + 1) /
                          quizQuestions.length) *
                        100
                      }
                    />

                    <Card className="border border-slate-100 p-5 shadow-lg dark:border-slate-800 md:p-8">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge>
                          UE {currentQuestion.ue}
                        </Badge>

                        <Badge variant="secondary">
                          {currentQuestion.theme}
                        </Badge>

                        <Badge variant="outline">
                          {currentQuestion.difficulty}
                        </Badge>

                        <button
                          type="button"
                          onClick={toggleFavorite}
                          className="ml-auto rounded-xl p-2 transition hover:bg-slate-100 dark:hover:bg-slate-800"
                          aria-label="Ajouter aux favoris"
                        >
                          <Star
                            className={`h-5 w-5 ${
                              favorites.includes(
                                currentQuestion.id,
                              )
                                ? "fill-amber-400 text-amber-400"
                                : "text-slate-400"
                            }`}
                          />
                        </button>
                      </div>

                      <MultiFormatQuestion
                        key={currentQuestion.id}
                        question={currentQuestion}
                        resolved={selectedAnswer !== null}
                        onResolve={resolveCurrentQuestion}
                      />

                      {selectedAnswer !== null && (
                        <Button
                          onClick={nextQuestion}
                          className="mt-6 w-full rounded-2xl px-5 py-3"
                        >
                          {questionIndex === quizQuestions.length - 1
                            ? "Voir mon résultat"
                            : "Question suivante"}
                          <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                      )}
                    </Card>

                    <p className="text-center text-xs text-slate-500 dark:text-slate-400">
                      Contenu pédagogique à confronter aux
                      cours, recommandations et protocoles
                      applicables.
                    </p>
                  </div>
                )}

              {quizFinished && (
                <div className="py-8 text-center">
                  <div className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-teal-100 text-teal-600 dark:bg-teal-950 dark:text-teal-300">
                    <Trophy className="h-12 w-12" />
                  </div>

                  <h2 className="mt-6 text-3xl font-black">
                    Quiz terminé !
                  </h2>

                  <p className="mt-2 text-slate-500 dark:text-slate-400">
                    Tu as obtenu
                  </p>

                  <p className="mt-2 text-5xl font-black text-teal-600 dark:text-teal-400">
                    {score}/{quizQuestions.length}
                  </p>

                  <p className="mt-3 font-semibold">
                    {score >=
                    Math.ceil(
                      quizQuestions.length * 0.8,
                    )
                      ? "Excellent travail !"
                      : score >=
                          Math.ceil(
                            quizQuestions.length * 0.5,
                          )
                        ? "Bonne progression."
                        : "Continue, tes erreurs reviendront en révision."}
                  </p>

                  <div className="mt-8 flex flex-wrap justify-center gap-3">
                    <Button
                      variant="outline"
                      onClick={() =>
                        navigateTo("home")
                      }
                      className="rounded-2xl px-5 py-3"
                    >
                      Accueil
                    </Button>

                    <Button
                      onClick={() =>
                        startQuiz(
                          activeQuizUE &&
                            ![
                              "Erreurs à revoir",
                              "Favoris",
                            ].includes(activeQuizUE)
                            ? activeQuizUE
                            : null,
                          quizQuestions.length,
                        )
                      }
                      className="rounded-2xl px-5 py-3"
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Recommencer
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* =================================================
              PROGRESSION
              ================================================= */}

          {page === "progress" && (
            <motion.div
              key="progress"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-3xl font-black">
                  Ma progression
                </h2>

                <p className="mt-1 text-slate-500 dark:text-slate-400">
                  Tes données sont enregistrées localement sur
                  cet appareil.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <StatCard
                  icon={Trophy}
                  label="Score moyen"
                  value={`${averageScore} %`}
                  accent="bg-amber-100 text-amber-600 dark:bg-amber-950"
                />

                <StatCard
                  icon={GraduationCap}
                  label="UE travaillées"
                  value={`${workedUEs} / ${ueData.length}`}
                  accent="bg-teal-100 text-teal-600 dark:bg-teal-950"
                />

                <StatCard
                  icon={Star}
                  label="Questions favorites"
                  value={favorites.length}
                  accent="bg-violet-100 text-violet-600 dark:bg-violet-950"
                />
              </div>

              <Card className="border border-slate-100 p-5 shadow-sm dark:border-slate-800 md:p-6">
                <h3 className="text-xl font-bold">
                  Historique des quiz
                </h3>

                {history.length === 0 ? (
                  <div className="py-10 text-center">
                    <Brain className="mx-auto h-10 w-10 text-slate-400" />

                    <p className="mt-4 font-semibold">
                      Aucun quiz terminé
                    </p>

                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      Termine ton premier quiz pour afficher ta
                      progression.
                    </p>

                    <Button
                      onClick={() => startQuiz(null, 5)}
                      disabled={allQuestions.length === 0}
                      className="mt-5 rounded-2xl px-5 py-3"
                    >
                      Commencer un quiz
                    </Button>
                  </div>
                ) : (
                  <div className="mt-5 space-y-3">
                    {history
                      .slice(0, 10)
                      .map((attempt) => {
                        const percentage = Math.round(
                          (attempt.score /
                            attempt.total) *
                            100,
                        );

                        return (
                          <div
                            key={attempt.id}
                            className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 p-4 dark:border-slate-800"
                          >
                            <div>
                              <p className="font-semibold">
                                {attempt.ue ===
                                "Quiz général"
                                  ? "Quiz général"
                                  : attempt.ue ===
                                      "Erreurs à revoir"
                                    ? "Erreurs à revoir"
                                    : attempt.ue ===
                                        "Favoris"
                                      ? "Questions favorites"
                                      : `UE ${attempt.ue}`}
                              </p>

                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                {new Date(
                                  attempt.date,
                                ).toLocaleDateString(
                                  "fr-FR",
                                  {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  },
                                )}
                              </p>
                            </div>

                            <div className="text-right">
                              <p className="font-black text-teal-600 dark:text-teal-400">
                                {attempt.score}/
                                {attempt.total}
                              </p>

                              <p className="text-xs text-slate-500">
                                {percentage} %
                              </p>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </Card>

              {history.length > 0 && (
                <Button
                  variant="danger"
                  onClick={() => {
                    const shouldDelete =
                      window.confirm(
                        "Supprimer tout l’historique, les erreurs et la progression ?",
                      );

                    if (shouldDelete) {
                      setHistory([]);
                      setWrongQuestionIds([]);
                    }
                  }}
                  className="rounded-2xl px-5 py-3"
                >
                  Effacer ma progression
                </Button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
{/* ===================================================
    PARAMÈTRES
    =================================================== */}

<AnimatePresence>
  {settingsOpen && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={() => setSettingsOpen(false)}
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 backdrop-blur-sm sm:items-center sm:p-4"
    >
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        onClick={(event) => event.stopPropagation()}
        className="max-h-[90vh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl dark:bg-slate-900 sm:max-w-lg sm:rounded-3xl sm:p-6"
      >
        {/* TITRE */}

        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black">
              Paramètres
            </h2>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Apparence et gestion des données locales.
            </p>
          </div>

          <Button
            variant="ghost"
            onClick={() => setSettingsOpen(false)}
            className="h-10 w-10 shrink-0 rounded-xl p-0"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* APPARENCE */}

        <section className="mt-7">
          <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Apparence
          </h3>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setDarkMode(false)}
              className={`flex items-center justify-center gap-2 rounded-2xl border-2 p-4 font-semibold transition ${
                !darkMode
                  ? "border-teal-500 bg-teal-50 text-teal-700"
                  : "border-slate-200 bg-white text-slate-700 hover:border-teal-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              }`}
            >
              <Sun className="h-5 w-5" />
              Mode clair
            </button>

            <button
              type="button"
              onClick={() => setDarkMode(true)}
              className={`flex items-center justify-center gap-2 rounded-2xl border-2 p-4 font-semibold transition ${
                darkMode
                  ? "border-teal-500 bg-teal-950 text-teal-300"
                  : "border-slate-200 bg-white text-slate-700 hover:border-teal-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              }`}
            >
              <Moon className="h-5 w-5" />
              Mode sombre
            </button>
          </div>
        </section>

        {/* INFORMATIONS */}

        <section className="mt-7">
          <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Informations
          </h3>

          <div className="mt-3 space-y-3">
            <div className="flex items-center justify-between rounded-2xl bg-slate-100 p-4 dark:bg-slate-800">
              <span className="font-semibold">
                Questions disponibles
              </span>

              <span className="rounded-full bg-teal-100 px-3 py-1 font-bold text-teal-700 dark:bg-teal-950 dark:text-teal-300">
                {allQuestions.length}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-2xl bg-slate-100 p-4 dark:bg-slate-800">
              <span className="font-semibold">
                Quiz terminés
              </span>

              <span className="rounded-full bg-blue-100 px-3 py-1 font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                {history.length}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-2xl bg-slate-100 p-4 dark:bg-slate-800">
              <span className="font-semibold">
                Questions favorites
              </span>

              <span className="rounded-full bg-amber-100 px-3 py-1 font-bold text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                {favorites.length}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-2xl bg-slate-100 p-4 dark:bg-slate-800">
              <span className="font-semibold">
                Erreurs à revoir
              </span>

              <span className="rounded-full bg-rose-100 px-3 py-1 font-bold text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                {wrongQuestionIds.length}
              </span>
            </div>
          </div>
        </section>

        {/* GESTION DES DONNÉES */}

        <section className="mt-7">
          <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Gestion des données
          </h3>

          <div className="mt-3 space-y-3">
            <Button
              variant="outline"
              disabled={favorites.length === 0}
              onClick={() => {
                const confirmation = window.confirm(
                  "Supprimer toutes les questions favorites ?",
                );

                if (confirmation) {
                  setFavorites([]);
                }
              }}
              className="w-full rounded-2xl px-5 py-3"
            >
              <Star className="mr-2 h-5 w-5" />
              Supprimer mes favoris
            </Button>

            <Button
              variant="outline"
              disabled={wrongQuestionIds.length === 0}
              onClick={() => {
                const confirmation = window.confirm(
                  "Effacer toutes les erreurs enregistrées ?",
                );

                if (confirmation) {
                  setWrongQuestionIds([]);
                }
              }}
              className="w-full rounded-2xl px-5 py-3"
            >
              <RotateCcw className="mr-2 h-5 w-5" />
              Effacer mes erreurs
            </Button>

            <Button
              variant="outline"
              disabled={history.length === 0}
              onClick={() => {
                const confirmation = window.confirm(
                  "Effacer tout l’historique des quiz ?",
                );

                if (confirmation) {
                  setHistory([]);
                }
              }}
              className="w-full rounded-2xl px-5 py-3"
            >
              <Clock3 className="mr-2 h-5 w-5" />
              Effacer mon historique
            </Button>

            <Button
              variant="danger"
              onClick={() => {
                const confirmation = window.confirm(
                  "Réinitialiser complètement l’application ?",
                );

                if (!confirmation) {
                  return;
                }

                setHistory([]);
                setFavorites([]);
                setWrongQuestionIds([]);
                setDarkMode(false);

                localStorage.removeItem(
                  "revis-ifsi-history",
                );

                localStorage.removeItem(
                  "revis-ifsi-favorites",
                );

                localStorage.removeItem(
                  "revis-ifsi-wrong-questions",
                );

                localStorage.removeItem(
                  "revis-ifsi-dark-mode",
                );

                setSettingsOpen(false);
                navigateTo("home");
              }}
              className="w-full rounded-2xl px-5 py-3"
            >
              <RotateCcw className="mr-2 h-5 w-5" />
              Réinitialiser l’application
            </Button>
          </div>
        </section>

        <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
          La progression est uniquement enregistrée sur cet
          appareil.
        </p>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>
      {/* ===================================================
          NAVIGATION MOBILE
          =================================================== */}

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 md:hidden">
        <div className="mx-auto grid max-w-md grid-cols-4">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = page === item.id;

            return (
              <button
                type="button"
                key={item.id}
                onClick={() => navigateTo(item.id)}
                className={`flex flex-col items-center gap-1 rounded-xl py-2 text-[11px] font-semibold transition ${
                  active
                    ? "text-teal-600 dark:text-teal-400"
                    : "text-slate-500 dark:text-slate-400"
                }`}
              >
                <Icon
                  className={`h-5 w-5 ${
                    active ? "stroke-[2.7]" : ""
                  }`}
                />

                {item.label}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}