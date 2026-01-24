"""
Head Repetitive Movement Feature Extractor
Detects rhythmic oscillations (up-down or left-right)
Uses sliding window and velocity sign changes
"""

import numpy as np
from typing import Dict, List

class HeadRepetitionFeature:
    """
    Extracts head repetitive movement behavioral marker.
    Detects oscillatory patterns in head position.
    """
    
    def __init__(self):
        self.head_positions = []
        self.window_size = 30  # frames
        self.MIN_RANGE = 0.05  # Minimum movement range to consider
    
    def add_position(self, position: np.ndarray):
        """Add head position from frame"""
        self.head_positions.append(position)
    
    def detect_oscillation(self, positions: List[np.ndarray], axis: int) -> Dict:
        """
        Detect oscillatory motion along specified axis.
        
        Args:
            positions: Array of positions
            axis: 0 for horizontal (x), 1 for vertical (y)
        
        Returns:
            Dict with oscillation count and range
        """
        if len(positions) < 5:
            return {'oscillations': 0, 'range': 0.0}
        
        pos_array = np.array(positions)
        values = pos_array[:, axis]
        
        # Calculate velocity and direction changes
        velocity = np.diff(values)
        sign_changes = np.sum(np.diff(np.sign(velocity)) != 0)
        
        # Range of motion
        motion_range = np.max(values) - np.min(values)
        
        # Count oscillations (each cycle = 2 sign changes)
        oscillations = sign_changes // 2 if motion_range > self.MIN_RANGE else 0
        
        return {
            'oscillations': int(oscillations),
            'range': float(motion_range)
        }
    
    def extract_from_window(self, window_size: int = None) -> Dict:
        """
        Analyze recent head positions for oscillations.
        
        Returns:
            Dictionary with horizontal and vertical oscillation counts
        """
        if window_size is None:
            window_size = self.window_size
        
        if len(self.head_positions) < window_size:
            return {
                'detected': False,
                'horizontal_oscillations': 0,
                'vertical_oscillations': 0,
                'total_oscillations': 0
            }
        
        recent = self.head_positions[-window_size:]
        
        # Detect horizontal and vertical oscillations
        h_osc = self.detect_oscillation(recent, axis=0)
        v_osc = self.detect_oscillation(recent, axis=1)
        
        total = max(h_osc['oscillations'], v_osc['oscillations'])
        
        return {
            'detected': total > 0,
            'horizontal_oscillations': h_osc['oscillations'],
            'vertical_oscillations': v_osc['oscillations'],
            'total_oscillations': total,
            'h_range': h_osc['range'],
            'v_range': v_osc['range']
        }
    
    def get_summary(self) -> Dict:
        """Get final oscillation analysis"""
        if not self.head_positions:
            return {
                'detected': False,
                'oscillations': 0,
                'horizontal': 0,
                'vertical': 0
            }
        
        # Use all positions for final analysis
        result = self.extract_from_window(window_size=min(150, len(self.head_positions)))
        
        return {
            'detected': result['detected'],
            'oscillations': result['total_oscillations'],
            'horizontal': result['horizontal_oscillations'],
            'vertical': result['vertical_oscillations']
        }
    
    def reset(self):
        """Reset for new session"""
        self.head_positions = []
