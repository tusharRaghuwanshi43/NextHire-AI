import os
from datetime import datetime
from typing import Dict, Any, List, Optional
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, KeepTogether
)
from app.core.config import settings

class PDFReportGenerator:
    @staticmethod
    def generate_candidate_report(
        interview_data: Dict[str, Any],
        evaluation_data: Dict[str, Any],
        claims_data: List[Dict[str, Any]],
        skill_gap_data: Dict[str, Any],
        output_filename: Optional[str] = None
    ) -> str:
        """
        Generate a professional multi-page PDF evaluation report using ReportLab.
        """
        candidate_name = interview_data.get("candidate_name", "Candidate")
        interview_id = str(interview_data.get("id", "interview"))
        
        if not output_filename:
            safe_name = candidate_name.replace(" ", "_")
            output_filename = f"NextHire_Report_{safe_name}_{interview_id[:8]}.pdf"
        
        output_path = os.path.join(settings.REPORTS_DIR, output_filename)
        
        doc = SimpleDocTemplate(
            output_path,
            pagesize=letter,
            leftMargin=36,
            rightMargin=36,
            topMargin=36,
            bottomMargin=36
        )
        
        styles = getSampleStyleSheet()
        
        # Custom palette & styles
        PRIMARY = colors.HexColor("#2563EB")     # Deep Blue
        SECONDARY = colors.HexColor("#1E293B")   # Slate 800
        ACCENT = colors.HexColor("#0D9488")      # Teal
        BG_LIGHT = colors.HexColor("#F8FAFC")    # Slate 50
        TEXT_MUTED = colors.HexColor("#64748B")  # Slate 500
        
        title_style = ParagraphStyle(
            'ReportTitle',
            parent=styles['Heading1'],
            fontName='Helvetica-Bold',
            fontSize=22,
            leading=26,
            textColor=PRIMARY
        )
        subtitle_style = ParagraphStyle(
            'ReportSubtitle',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=10,
            leading=14,
            textColor=TEXT_MUTED
        )
        section_heading = ParagraphStyle(
            'SectionHeading',
            parent=styles['Heading2'],
            fontName='Helvetica-Bold',
            fontSize=13,
            leading=16,
            textColor=SECONDARY,
            spaceBefore=12,
            spaceAfter=6
        )
        body_style = ParagraphStyle(
            'ReportBody',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=9,
            leading=13,
            textColor=colors.HexColor("#334155")
        )
        body_bold = ParagraphStyle(
            'ReportBodyBold',
            parent=body_style,
            fontName='Helvetica-Bold'
        )
        badge_style = ParagraphStyle(
            'BadgeStyle',
            parent=body_style,
            fontName='Helvetica-Bold',
            fontSize=8,
            leading=10,
            textColor=colors.HexColor("#1E40AF")
        )

        elements = []

        # --- HEADER BANNER ---
        header_table = Table(
            [
                [
                    Paragraph("<b>NEXTHIRE AI</b> &mdash; Candidate Technical Assessment", title_style),
                    Paragraph(f"<b>Date:</b> {datetime.utcnow().strftime('%B %d, %Y')}<br/><b>ID:</b> {interview_id[:12]}", subtitle_style)
                ]
            ],
            colWidths=[380, 160]
        )
        header_table.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('BOTTOMPADDING', (0,0), (-1,-1), 8)
        ]))
        elements.append(header_table)
        elements.append(HRFlowable(width="100%", thickness=2, color=PRIMARY, spaceBefore=4, spaceAfter=12))

        # --- CANDIDATE INFO STRIP ---
        role = interview_data.get("target_role", "Software Engineer")
        email = interview_data.get("candidate_email", "N/A")
        overall_score = evaluation_data.get("overall_score", 0.0)

        info_data = [
            [
                Paragraph(f"<b>Candidate:</b> {candidate_name}", body_style),
                Paragraph(f"<b>Role:</b> {role}", body_style),
                Paragraph(f"<b>Email:</b> {email}", body_style),
                Paragraph(f"<b>Overall Score:</b> <font color='#2563EB' size='12'><b>{overall_score}/100</b></font>", body_style)
            ]
        ]
        info_table = Table(info_data, colWidths=[140, 130, 140, 130])
        info_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), BG_LIGHT),
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#CBD5E1")),
            ('PADDING', (0,0), (-1,-1), 6),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE')
        ]))
        elements.append(info_table)
        elements.append(Spacer(1, 10))

        # --- WEIGHTED EVALUATION SCORES ---
        elements.append(Paragraph("1. Deterministic Weighted Evaluation Scores", section_heading))
        comp = evaluation_data.get("average_components", {})
        
        scores_table_data = [
            [Paragraph("<b>Evaluation Dimension</b>", body_bold), Paragraph("<b>Weight</b>", body_bold), Paragraph("<b>Score (0-100)</b>", body_bold), Paragraph("<b>Weighted Impact</b>", body_bold)],
            [Paragraph("Technical Accuracy", body_style), Paragraph("40%", body_style), Paragraph(str(comp.get("technical_accuracy", 0.0)), body_style), Paragraph(f"{round(float(comp.get('technical_accuracy', 0.0)) * 0.40, 2)}", body_style)],
            [Paragraph("Technical Depth", body_style), Paragraph("25%", body_style), Paragraph(str(comp.get("technical_depth", 0.0)), body_style), Paragraph(f"{round(float(comp.get('technical_depth', 0.0)) * 0.25, 2)}", body_style)],
            [Paragraph("Resume Consistency", body_style), Paragraph("20%", body_style), Paragraph(str(comp.get("resume_consistency", 0.0)), body_style), Paragraph(f"{round(float(comp.get('resume_consistency', 0.0)) * 0.20, 2)}", body_style)],
            [Paragraph("Communication", body_style), Paragraph("10%", body_style), Paragraph(str(comp.get("communication", 0.0)), body_style), Paragraph(f"{round(float(comp.get('communication', 0.0)) * 0.10, 2)}", body_style)],
            [Paragraph("Confidence", body_style), Paragraph("5%", body_style), Paragraph(str(comp.get("confidence", 0.0)), body_style), Paragraph(f"{round(float(comp.get('confidence', 0.0)) * 0.05, 2)}", body_style)],
            [Paragraph("<b>FINAL WEIGHTED SCORE</b>", body_bold), Paragraph("<b>100%</b>", body_bold), Paragraph(f"<b>{overall_score}</b>", body_bold), Paragraph(f"<b>{overall_score} / 100</b>", body_bold)]
        ]
        scores_table = Table(scores_table_data, colWidths=[200, 80, 110, 150])
        scores_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#E2E8F0")),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
            ('BACKGROUND', (0,-1), (-1,-1), colors.HexColor("#EFF6FF")),
            ('PADDING', (0,0), (-1,-1), 5),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE')
        ]))
        elements.append(scores_table)
        elements.append(Spacer(1, 10))

        # --- EXECUTIVE SUMMARY ---
        summary_text = evaluation_data.get("executive_summary", "Evaluation completed successfully.")
        elements.append(Paragraph("<b>Executive Summary:</b> " + summary_text, body_style))
        elements.append(Spacer(1, 10))

        # --- RESUME CLAIMS VERIFICATION ---
        elements.append(Paragraph("2. Resume Claim Verification (Evidence-Based)", section_heading))
        if claims_data:
            claims_rows = [
                [Paragraph("<b>Claim Statement</b>", body_bold), Paragraph("<b>Status</b>", body_bold), Paragraph("<b>Confidence</b>", body_bold), Paragraph("<b>Audited Evidence & Explanation</b>", body_bold)]
            ]
            for cl in claims_data[:5]:
                status_val = str(cl.get("status", "unverified")).replace("_", " ").title()
                conf_val = f"{cl.get('confidence_score', 0.0)}%"
                exp = cl.get("explanation", "")
                sup = "; ".join(cl.get("supporting_evidence", []))
                evidence_text = f"{exp} <i>({sup})</i>" if sup else exp

                claims_rows.append([
                    Paragraph(cl.get("claim_text", "")[:120], body_style),
                    Paragraph(status_val, badge_style),
                    Paragraph(conf_val, body_style),
                    Paragraph(evidence_text[:200], body_style)
                ])
            claims_table = Table(claims_rows, colWidths=[160, 90, 70, 220])
            claims_table.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#F1F5F9")),
                ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
                ('PADDING', (0,0), (-1,-1), 5),
                ('VALIGN', (0,0), (-1,-1), 'TOP')
            ]))
            elements.append(claims_table)
        else:
            elements.append(Paragraph("No explicit claims flagged for verification.", body_style))

        elements.append(Spacer(1, 10))

        # --- SKILL-GAP ANALYSIS & LEARNING ROADMAP ---
        elements.append(Paragraph("3. Skill-Gap Analysis & Personalized 4-Week Roadmap", section_heading))
        strong = skill_gap_data.get("strong_skills", [])
        weak = skill_gap_data.get("weak_skills", [])
        
        strong_names = ", ".join([f"{s.get('skill_name') if isinstance(s, dict) else s.skill_name} ({s.get('proficiency_level', 'Proficient') if isinstance(s, dict) else s.proficiency_level})" for s in strong[:4]])
        weak_names = ", ".join([f"{w.get('skill_name') if isinstance(w, dict) else w.skill_name} ({w.get('proficiency_level', 'Needs Work') if isinstance(w, dict) else w.proficiency_level})" for w in weak[:4]])

        elements.append(Paragraph(f"<b>Demonstrated Strengths:</b> {strong_names or 'General competency'}", body_style))
        elements.append(Paragraph(f"<b>Target Development Areas:</b> {weak_names or 'Distributed architecture'}", body_style))
        elements.append(Spacer(1, 6))

        # Roadmap table
        roadmap_items = skill_gap_data.get("learning_roadmap", [])
        if roadmap_items:
            road_data = [
                [Paragraph("<b>Phase / Timeline</b>", body_bold), Paragraph("<b>Focus Area</b>", body_bold), Paragraph("<b>Action Items & Curated Resources</b>", body_bold)]
            ]
            for rm in roadmap_items[:4]:
                phase = rm.get("week_or_phase", "Phase") if isinstance(rm, dict) else rm.week_or_phase
                topic = rm.get("focus_topic", "Topic") if isinstance(rm, dict) else rm.focus_topic
                actions = rm.get("action_items", []) if isinstance(rm, dict) else rm.action_items
                resources = rm.get("resources", []) if isinstance(rm, dict) else rm.resources
                combined = f"• {'<br/>• '.join(actions[:2])}<br/><i>Resources: {', '.join(resources[:2])}</i>"
                road_data.append([
                    Paragraph(phase, body_bold),
                    Paragraph(topic, body_style),
                    Paragraph(combined, body_style)
                ])
            road_table = Table(road_data, colWidths=[120, 130, 290])
            road_table.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#F8FAFC")),
                ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
                ('PADDING', (0,0), (-1,-1), 5),
                ('VALIGN', (0,0), (-1,-1), 'TOP')
            ]))
            elements.append(road_table)

        # Build document
        doc.build(elements)
        return output_path

pdf_report_generator = PDFReportGenerator()
