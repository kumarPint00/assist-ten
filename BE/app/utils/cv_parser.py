"""CV Parser - Parse and structure CV sections for flexible                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      editing."""
from typing import Dict, List, Optional, Tuple
import re
from dataclasses import dataclass


@dataclass
class CVSection:
    """Represents a section of a CV."""
    name: str
    title: str
    content: str
    items: List[Dict[str, str]] = None
    include: bool = True


class CVParser:
    """Parse CV text and extract structured sections."""
    
    # Section patterns to identify in CV
    SECTION_PATTERNS = {
        'summary': [r'summary', r'objective', r'profile', r'about', r'introduction'],
        'contact': [r'contact', r'contact\s+info', r'contact\s+information'],
        'experience': [r'work\s+experience', r'professional\s+experience', r'employment', r'career\s+history', r'^experience'],
        'education': [r'education', r'academic', r'university', r'degree'],
        'skills': [r'technical\s+skills', r'skills', r'core\s+competencies', r'expertise', r'technical\s+proficiency'],
        'certifications': [r'certification', r'certificate', r'license', r'awarded'],
        'projects': [r'projects', r'portfolio', r'achievements', r'notable\s+work'],
        'languages': [r'languages', r'language\s+proficiency'],
    }
    
    def __init__(self, cv_text: str):
        """Initialize parser with CV text."""
        self.cv_text = cv_text
        self.lines = cv_text.split('\n')
        self.sections: Dict[str, CVSection] = {}
    
    def parse(self) -> Dict[str, CVSection]:
        """Parse CV and return structured sections."""
        self._identify_sections()
        self._extract_section_items()
        return self.sections
    
    def _identify_sections(self) -> None:
        """Identify and extract sections from CV."""
        section_starts = {}
        
        for line_idx, line in enumerate(self.lines):
            line_lower = line.lower().strip()
            
            # Skip empty lines
            if not line_lower:
                continue
            
            # Check for section headers
            for section_type, patterns in self.SECTION_PATTERNS.items():
                for pattern in patterns:
                    if re.search(r'\b' + pattern + r'\b', line_lower):
                        section_starts[section_type] = line_idx
                        break
        
        # Extract section content
        sorted_sections = sorted(section_starts.items(), key=lambda x: x[1])
        
        for i, (section_type, start_line) in enumerate(sorted_sections):
            # Find end line (start of next section or end of file)
            end_line = sorted_sections[i+1][1] if i+1 < len(sorted_sections) else len(self.lines)
            
            # Extract section content
            section_content = '\n'.join(self.lines[start_line:end_line]).strip()
            
            self.sections[section_type] = CVSection(
                name=section_type,
                title=self.lines[start_line].strip(),
                content=section_content,
                items=[],
                include=True
            )
    
    def _extract_section_items(self) -> None:
        """Extract items from each section."""
        for section_type, section in self.sections.items():
            if section_type == 'experience':
                self._extract_experience_items(section)
            elif section_type == 'education':
                self._extract_education_items(section)
            elif section_type == 'skills':
                self._extract_skills_items(section)
            elif section_type == 'projects':
                self._extract_projects_items(section)
    
    def _extract_experience_items(self, section: CVSection) -> None:
        """Extract experience entries (companies and roles)."""
        lines = section.content.split('\n')[1:]  # Skip header
        
        current_entry = None
        for line in lines:
            line = line.strip()
            if not line:
                if current_entry:
                    section.items.append(current_entry)
                    current_entry = None
                continue
            
            # Look for company/role indicators
            if current_entry is None:
                current_entry = {
                    'company': line,
                    'role': '',
                    'dates': '',
                    'description': '',
                    'content': line
                }
            else:
                if not current_entry['role'] and any(role in line.lower() for role in ['engineer', 'developer', 'manager', 'designer', 'analyst']):
                    current_entry['role'] = line
                elif re.search(r'\d{4}', line):
                    current_entry['dates'] = line
                else:
                    current_entry['description'] += '\n' + line if current_entry['description'] else line
                current_entry['content'] += '\n' + line
        
        if current_entry:
            section.items.append(current_entry)
    
    def _extract_education_items(self, section: CVSection) -> None:
        """Extract education entries."""
        lines = section.content.split('\n')[1:]  # Skip header
        
        current_entry = None
        for line in lines:
            line = line.strip()
            if not line:
                if current_entry:
                    section.items.append(current_entry)
                    current_entry = None
                continue
            
            if current_entry is None:
                current_entry = {
                    'degree': line,
                    'institution': '',
                    'year': '',
                    'content': line
                }
            else:
                if re.search(r'\d{4}', line):
                    current_entry['year'] = line
                elif not current_entry['institution']:
                    current_entry['institution'] = line
                current_entry['content'] += '\n' + line
        
        if current_entry:
            section.items.append(current_entry)
    
    def _extract_skills_items(self, section: CVSection) -> None:
        """Extract individual skills."""
        lines = section.content.split('\n')[1:]  # Skip header
        
        for line in lines:
            line = line.strip()
            if line and not line.isupper():
                # Split by comma or semicolon
                skills = re.split(r'[,;]', line)
                for skill in skills:
                    skill = skill.strip()
                    if skill:
                        section.items.append({
                            'skill': skill,
                            'content': skill,
                            'include': True
                        })
    
    def _extract_projects_items(self, section: CVSection) -> None:
        """Extract project entries."""
        lines = section.content.split('\n')[1:]  # Skip header
        
        current_entry = None
        for line in lines:
            line = line.strip()
            if not line:
                if current_entry:
                    section.items.append(current_entry)
                    current_entry = None
                continue
            
            if current_entry is None:
                current_entry = {
                    'project': line,
                    'description': '',
                    'content': line
                }
            else:
                current_entry['description'] += '\n' + line if current_entry['description'] else line
                current_entry['content'] += '\n' + line
        
        if current_entry:
            section.items.append(current_entry)
    
    def rebuild_cv(self, sections_config: Dict[str, Dict]) -> str:
        """Rebuild CV based on section configuration.
        
        Args:
            sections_config: {
                'experience': {'include': True, 'exclude_items': ['company1', 'company2']},
                'education': {'include': True, 'exclude_items': []},
                ...
            }
        """
        rebuilt_lines = []
        
        for section_type in ['summary', 'contact', 'experience', 'education', 'skills', 'certifications', 'projects', 'languages']:
            if section_type not in self.sections:
                continue
            
            section = self.sections[section_type]
            config = sections_config.get(section_type, {})
            
            # Check if section should be included
            if not config.get('include', True):
                continue
            
            # Add section header
            rebuilt_lines.append(section.title)
            rebuilt_lines.append('')
            
            # Add section items (filtered)
            exclude_items = config.get('exclude_items', [])
            
            if not section.items:
                # No structured items, use raw content
                rebuilt_lines.append(section.content.split('\n', 1)[1].strip())
            else:
                for item in section.items:
                    # Check if item should be excluded
                    if any(exclude_key in str(item.get('content', '')).lower() for exclude_key in exclude_items):
                        continue
                    
                    rebuilt_lines.append(item.get('content', ''))
                    rebuilt_lines.append('')
            
            rebuilt_lines.append('\n')
        
        return '\n'.join(rebuilt_lines).strip()
    
    def get_summary(self) -> Dict[str, any]:
        """Get summary of CV structure for UI display."""
        summary = {}
        
        for section_type, section in self.sections.items():
            if not section.items:
                summary[section_type] = {
                    'count': 0,
                    'title': section.title,
                    'items': []
                }
            else:
                items_display = []
                
                if section_type == 'experience':
                    items_display = [
                        {
                            'id': item['company'],
                            'label': f"{item.get('role', '')} at {item['company']}".strip(),
                            'company': item['company'],
                            'include': True
                        }
                        for item in section.items
                    ]
                elif section_type == 'education':
                    items_display = [
                        {
                            'id': f"{item.get('degree', '')}-{item.get('year', '')}",
                            'label': f"{item.get('degree', '')} - {item.get('institution', '')} ({item.get('year', '')})".strip(),
                            'include': True
                        }
                        for item in section.items
                    ]
                elif section_type == 'skills':
                    items_display = [
                        {
                            'id': item['skill'],
                            'label': item['skill'],
                            'include': True
                        }
                        for item in section.items
                    ]
                elif section_type == 'projects':
                    items_display = [
                        {
                            'id': item['project'],
                            'label': item['project'],
                            'include': True
                        }
                        for item in section.items
                    ]
                
                summary[section_type] = {
                    'count': len(items_display),
                    'title': section.title,
                    'items': items_display
                }
        
        return summary
