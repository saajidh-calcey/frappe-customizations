import frappe
import json

@frappe.whitelist()
def create_survey(survey_json_question=None, survey_json_answer=None):
    if isinstance(survey_json_question, str):
        survey_json_question = json.loads(survey_json_question)
    
    if isinstance(survey_json_answer, str):
        survey_json_answer = json.loads(survey_json_answer)
    
    title = "Untitled Survey"
    if survey_json_question:
        title = survey_json_question.get("title", "Untitled Survey")
        
    doc = frappe.get_doc({
        "doctype": "SurveyJs",
        "title": title,
        "survey_json_question": json.dumps(survey_json_question) if survey_json_question else None,
        "survey_json_answer": json.dumps(survey_json_answer) if survey_json_answer else None
    })
    doc.insert()
    return doc.name

@frappe.whitelist()
def get_latest_survey():
    surveys = frappe.get_all("SurveyJs", fields=["name", "survey_json_question", "survey_json_answer"], order_by="creation desc", limit=1)
    if surveys:
        return surveys[0]
    return None

@frappe.whitelist()
def update_survey_answer(name, survey_json_answer):
    if isinstance(survey_json_answer, str):
        survey_json_answer = json.loads(survey_json_answer)
        
    doc = frappe.get_doc("SurveyJs", name)
    doc.survey_json_answer = json.dumps(survey_json_answer)
    doc.save()
    return doc.name
