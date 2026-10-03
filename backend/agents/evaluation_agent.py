from services.ai_service import generate_json


def _safe_score(value):
    try:
        return max(
            0,
            min(100, round(float(value))),
        )
    except (TypeError, ValueError):
        return 0


def _empty_evaluation():
    return {
        "overall_score": 0,
        "technical_score": 0,
        "relevance_score": 0,
        "clarity_score": 0,
        "communication_score": 0,
        "answered_questions": 0,
        "total_questions": 0,
        "feedback": [],
    }


def _clean_text(value):
    return str(value or "").strip()


def _word_count(text):
    return len(
        _clean_text(text).split()
    )


def _has_substance(answer):
    text = _clean_text(answer)

    if not text:
        return False

    return len(text.split()) >= 3


def _contains_explanation(answer):
    text = _clean_text(answer).lower()

    explanation_words = {
        "because",
        "therefore",
        "however",
        "example",
        "for example",
        "such as",
        "first",
        "then",
        "finally",
        "when",
        "where",
        "using",
        "used",
        "works",
        "approach",
    }

    return any(
        word in text
        for word in explanation_words
    )


def _technical_quality(answer):
    """
    Fallback technical-quality estimate.

    This does not verify arbitrary technical facts.
    It only evaluates the structure and substance of
    the supplied answer.
    """

    if not _has_substance(answer):
        return 0

    words = _word_count(answer)

    score = 35

    if words >= 10:
        score += 15

    if words >= 25:
        score += 15

    if words >= 50:
        score += 10

    if _contains_explanation(answer):
        score += 15

    return _safe_score(score)


def _relevance_quality(
    question,
    answer,
):
    if not _has_substance(answer):
        return 0

    question_words = {
        word.strip(
            ".,?!:;()[]{}"
        ).lower()
        for word in _clean_text(
            question
        ).split()
        if len(
            word.strip(
                ".,?!:;()[]{}"
            )
        ) > 3
    }

    answer_words = {
        word.strip(
            ".,?!:;()[]{}"
        ).lower()
        for word in _clean_text(
            answer
        ).split()
        if len(
            word.strip(
                ".,?!:;()[]{}"
            )
        ) > 3
    }

    overlap = question_words.intersection(
        answer_words
    )

    score = 45

    if overlap:
        score += min(
            30,
            len(overlap) * 10,
        )

    if _word_count(answer) >= 20:
        score += 10

    if _contains_explanation(answer):
        score += 10

    return _safe_score(score)


def _clarity_quality(answer):
    if not _has_substance(answer):
        return 0

    text = _clean_text(answer)

    score = 50

    words = _word_count(text)

    if 8 <= words <= 120:
        score += 20

    if words > 180:
        score -= 10

    if _contains_explanation(text):
        score += 15

    if text[0].isupper():
        score += 5

    if text.endswith(
        (".", "!", "?")
    ):
        score += 5

    return _safe_score(score)


def _communication_quality(answer):
    if not _has_substance(answer):
        return 0

    score = 50

    words = _word_count(answer)

    if words >= 10:
        score += 15

    if words >= 25:
        score += 10

    if _contains_explanation(answer):
        score += 15

    text = _clean_text(answer)

    if text and text[0].isupper():
        score += 5

    if text.endswith(
        (".", "!", "?")
    ):
        score += 5

    return _safe_score(score)


def _completeness_quality(answer):
    if not _has_substance(answer):
        return 0

    words = _word_count(answer)

    if words < 8:
        return 40

    if words < 20:
        return 60

    if words < 40:
        return 75

    if words < 80:
        return 90

    return 95


def _question_feedback(
    question,
    answer,
    question_type,
    skill,
):
    if not _has_substance(answer):
        return (
            "No answer was provided. Practice giving a "
            "direct response and support it with a brief "
            "explanation or example."
        )

    words = _word_count(answer)

    if question_type == "Technical":

        if words < 10:
            return (
                f"The answer is brief. Explain the relevant "
                f"technical concept in more detail and include "
                f"a practical example where appropriate"
                + (
                    f" related to {skill}."
                    if skill
                    else "."
                )
            )

        if not _contains_explanation(answer):
            return (
                "The answer addresses the question, but the "
                "reasoning could be clearer. Explain why the "
                "approach works and include a practical example."
            )

        return (
            "The answer provides a reasonable explanation. "
            "Continue improving it by connecting the concept "
            "to a concrete implementation or example."
        )

    if question_type == "Role-specific":

        if words < 15:
            return (
                "The answer is concise but could be stronger. "
                "Connect your response more directly to the "
                "target role and explain your approach."
            )

        return (
            "The response is relevant to the role. Strengthen "
            "it further by explaining your reasoning and "
            "connecting it to practical work."
        )

    if words < 15:
        return (
            "The response is quite brief. Give a more complete "
            "answer with a clear explanation and, where "
            "appropriate, a genuine example from your experience."
        )

    return (
        "The response is reasonably structured. Keep the answer "
        "direct and support important points with genuine examples."
    )


def _normalize_feedback(feedback):
    """
    Normalize AI-generated feedback into the format
    expected by the frontend.
    """

    if not isinstance(
        feedback,
        list,
    ):
        return []

    result = []

    for item in feedback:

        if not isinstance(
            item,
            dict,
        ):
            continue

        question = _clean_text(
            item.get("question")
        )

        feedback_text = _clean_text(
            item.get("feedback")
        )

        if not question:
            continue

        if not feedback_text:
            feedback_text = (
                "No detailed feedback was generated "
                "for this question."
            )

        result.append({
            "question": question,
            "feedback": feedback_text,
        })

    return result


def evaluate_interview(
    questions: list[dict],
    answers: list[dict],
):
    """
    Evaluate interview answers.

    Primary path:
        Local LLM through Ollama.

    Fallback path:
        Rule-based evaluation.

    The AI evaluator considers:
        - Technical quality
        - Relevance
        - Clarity
        - Communication
        - Completeness
        - Question-specific feedback
    """

    if not questions:
        return _empty_evaluation()

    if not isinstance(
        answers,
        list,
    ):
        answers = []

    # -----------------------------------------------------
    # PRIMARY AI PATH
    # -----------------------------------------------------

    ai = generate_json(
        f"""
You are the Interview Evaluation Agent in PrepMate AI.

Evaluate this candidate's interview performance as a
placement interviewer.

You must evaluate the actual answers against the
corresponding questions.

Consider:

1. Technical quality
2. Relevance to the question
3. Clarity of explanation
4. Communication quality
5. Completeness
6. Whether the answer demonstrates understanding
7. Whether examples and reasoning are appropriate

IMPORTANT RULES:

- Evaluate only what the candidate actually answered.
- Do not invent candidate knowledge or experience.
- Do not assume an answer is technically correct merely
  because it contains technical keywords.
- If technical correctness cannot be confidently determined
  from the answer, evaluate the explanation and reasoning
  while avoiding unsupported claims.
- Empty or extremely short answers should receive low scores.
- Give useful question-specific feedback.
- Do not give every answer the same score.
- Scores must be integers from 0 to 100.
- Overall score should reflect the candidate's complete
  interview performance.
- answered_questions must count meaningful answers.
- total_questions must equal the number of supplied questions.
- Return ONLY valid JSON.

Questions:
{questions}

Candidate answers:
{answers}

Return exactly this structure:

{{
    "overall_score": 0,
    "technical_score": 0,
    "relevance_score": 0,
    "clarity_score": 0,
    "communication_score": 0,
    "answered_questions": 0,
    "total_questions": {len(questions)},
    "feedback": [
        {{
            "question": "The exact question",
            "feedback": "Specific feedback for the candidate"
        }}
    ]
}}
""",
        system=(
            "You are a careful placement-interview evaluator. "
            "Evaluate only the supplied questions and answers. "
            "Do not invent facts about the candidate. "
            "Give realistic scores and useful feedback. "
            "Return only valid JSON."
        ),
    )

    # -----------------------------------------------------
    # VALIDATE AI RESPONSE
    # -----------------------------------------------------

    if isinstance(
        ai,
        dict,
    ):

        feedback = _normalize_feedback(
            ai.get("feedback")
        )

        if feedback:

            answered_from_answers = sum(
                1
                for item in answers
                if isinstance(item, dict)
                and _has_substance(
                    item.get("answer")
                )
            )

            try:
                ai_answered = int(
                    ai.get(
                        "answered_questions",
                        answered_from_answers,
                    )
                )
            except (
                TypeError,
                ValueError,
            ):
                ai_answered = answered_from_answers

            answered_questions = max(
                0,
                min(
                    len(questions),
                    ai_answered,
                ),
            )

            return {
                "overall_score": _safe_score(
                    ai.get("overall_score")
                ),
                "technical_score": _safe_score(
                    ai.get("technical_score")
                ),
                "relevance_score": _safe_score(
                    ai.get("relevance_score")
                ),
                "clarity_score": _safe_score(
                    ai.get("clarity_score")
                ),
                "communication_score": _safe_score(
                    ai.get("communication_score")
                ),
                "answered_questions": answered_questions,
                "total_questions": len(
                    questions
                ),
                "feedback": feedback,
            }

    # -----------------------------------------------------
    # FALLBACK RULE-BASED EVALUATION
    # -----------------------------------------------------

    answer_map = {}

    for item in answers:

        if not isinstance(
            item,
            dict,
        ):
            continue

        question = _clean_text(
            item.get("question")
        )

        answer = _clean_text(
            item.get("answer")
        )

        if question:
            answer_map[question] = answer

    total_questions = len(
        questions
    )

    answered_questions = 0

    technical_scores = []
    relevance_scores = []
    clarity_scores = []
    communication_scores = []
    completeness_scores = []

    feedback = []

    for question_item in questions:

        if not isinstance(
            question_item,
            dict,
        ):
            continue

        question = _clean_text(
            question_item.get("question")
        )

        question_type = _clean_text(
            question_item.get(
                "type",
                "General",
            )
        )

        skill = question_item.get(
            "skill"
        )

        skill = (
            _clean_text(skill)
            if skill is not None
            else ""
        )

        answer = answer_map.get(
            question,
            "",
        )

        if _has_substance(answer):
            answered_questions += 1

        relevance = _relevance_quality(
            question,
            answer,
        )

        clarity = _clarity_quality(
            answer
        )

        communication = _communication_quality(
            answer
        )

        completeness = _completeness_quality(
            answer
        )

        if question_type == "Technical":

            technical = _technical_quality(
                answer
            )

            technical_scores.append(
                technical
            )

        relevance_scores.append(
            relevance
        )

        clarity_scores.append(
            clarity
        )

        communication_scores.append(
            communication
        )

        completeness_scores.append(
            completeness
        )

        feedback.append({
            "question": question,
            "feedback": _question_feedback(
                question=question,
                answer=answer,
                question_type=question_type,
                skill=skill,
            ),
        })

    def average(values):

        if not values:
            return 0

        return _safe_score(
            sum(values) / len(values)
        )

    technical_score = average(
        technical_scores
    )

    relevance_score = average(
        relevance_scores
    )

    clarity_score = average(
        clarity_scores
    )

    communication_score = average(
        communication_scores
    )

    completeness_score = average(
        completeness_scores
    )

    overall_score = _safe_score(
        (
            technical_score
            + relevance_score
            + clarity_score
            + communication_score
            + completeness_score
        )
        / 5
    )

    return {
        "overall_score": overall_score,
        "technical_score": technical_score,
        "relevance_score": relevance_score,
        "clarity_score": clarity_score,
        "communication_score": communication_score,
        "answered_questions": answered_questions,
        "total_questions": total_questions,
        "feedback": feedback,
    }