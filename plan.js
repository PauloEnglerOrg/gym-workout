// Starting plan, copied from the "Workout Plan Tracker" spreadsheet.
// (After the first launch the plan lives on the phone and is edited inside the app.)
// weekday: 0 = Sunday, 1 = Monday ... 6 = Saturday
const DEFAULT_PLAN = {
  days: [
    {
      id: 'd1', name: 'Push + Calves', weekday: 1,
      exercises: [
        { id: 'd1e1', lib: 'Dumbbell_Bench_Press', name: 'Flat Dumbbell Bench Press', sets: 4, reps: '8-10', rest: 90, weight: 0, step: 0.5, notes: 'Focus on full range of motion.' },
        { id: 'd1e2', lib: 'Standing_Military_Press', name: 'Overhead Barbell Press', sets: 3, reps: '8-10', rest: 90, weight: 0, step: 0.5, notes: 'Keep core engaged.' },
        { id: 'd1e3', lib: 'Triceps_Pushdown', name: 'Tricep Pushdowns', sets: 3, reps: '10-12', rest: 60, weight: 0, step: 0.5, notes: 'Squeeze at the bottom.' },
        { id: 'd1e4', lib: 'Standing_Calf_Raises', name: 'Standing Calf Raises', sets: 4, reps: '15', rest: 60, weight: 0, step: 0.5, notes: 'Pause at the stretch and peak contraction.' },
        { id: 'd1e5', lib: 'Seated_Calf_Raise', name: 'Seated Calf Raises', sets: 3, reps: '15', rest: 60, weight: 0, step: 0.5, notes: 'Target the soleus muscle.' }
      ]
    },
    {
      id: 'd2', name: 'Pull + Hip Add/Abd', weekday: 2,
      exercises: [
        { id: 'd2e1', lib: 'Wide-Grip_Lat_Pulldown', name: 'Lat Pulldowns or Pull-ups', sets: 4, reps: '8-10', rest: 90, weight: 0, step: 0.5, notes: 'Control the eccentric phase.' },
        { id: 'd2e2', lib: 'One-Arm_Dumbbell_Row', name: 'Dumbbell Rows', sets: 3, reps: '10-12', rest: 90, weight: 0, step: 0.5, notes: 'Squeeze shoulder blades together.' },
        { id: 'd2e3', lib: 'Dumbbell_Bicep_Curl', name: 'Bicep Curls', sets: 3, reps: '10-12', rest: 60, weight: 0, step: 0.5, notes: 'Keep elbows pinned to your sides.' },
        { id: 'd2e4', lib: 'Thigh_Adductor', name: 'Machine Hip Adduction', sets: 3, reps: '12-15', rest: 60, weight: 0, step: 0.5, notes: 'Slow and controlled inward squeeze.' },
        { id: 'd2e5', lib: 'Thigh_Abductor', name: 'Machine Hip Abduction', sets: 3, reps: '12-15', rest: 60, weight: 0, step: 0.5, notes: 'Focus on the outer glutes.' }
      ]
    },
    {
      id: 'd3', name: 'Core + Squats', weekday: 3,
      exercises: [
        { id: 'd3e1', lib: 'Barbell_Squat', name: 'Barbell Squats', sets: 4, reps: '6-8', rest: 120, weight: 0, step: 0.5, notes: 'Drive through the mid-foot, maintain depth.' },
        { id: 'd3e2', lib: 'Split_Squat_with_Dumbbells', name: 'Bulgarian Split Squats', sets: 3, reps: '8-10 / leg', rest: 90, weight: 0, step: 0.5, notes: 'Keep torso slightly upright for quad focus.' },
        { id: 'd3e3', lib: 'Hanging_Leg_Raise', name: 'Hanging Leg Raises', sets: 3, reps: '12-15', rest: 60, weight: 0, step: 0.5, notes: 'Avoid swinging; use core to lift.' },
        { id: 'd3e4', lib: 'Cable_Crunch', name: 'Cable Crunches', sets: 3, reps: '15', rest: 60, weight: 0, step: 0.5, notes: 'Round the back to contract abs.' },
        { id: 'd3e5', lib: 'Plank', name: 'Plank', sets: 3, reps: '45-60', rest: 45, weight: 0, step: 0.5, timed: true, notes: 'Squeeze glutes and brace core.' }
      ]
    },
    {
      id: 'd4', name: 'Push + Hamstrings', weekday: 4,
      exercises: [
        { id: 'd4e1', lib: 'Barbell_Incline_Bench_Press_-_Medium_Grip', name: 'Incline Barbell Bench Press', sets: 4, reps: '8-10', rest: 90, weight: 0, step: 0.5, notes: 'Target upper chest.' },
        { id: 'd4e2', lib: 'Side_Lateral_Raise', name: 'Dumbbell Lateral Raises', sets: 4, reps: '12-15', rest: 60, weight: 0, step: 0.5, notes: 'Lead with the elbows.' },
        { id: 'd4e3', lib: 'EZ-Bar_Skullcrusher', name: 'Skull Crushers', sets: 3, reps: '10-12', rest: 60, weight: 0, step: 0.5, notes: 'Keep upper arms stationary.' },
        { id: 'd4e4', lib: 'Romanian_Deadlift', name: 'Romanian Deadlifts (RDLs)', sets: 4, reps: '8-10', rest: 90, weight: 0, step: 0.5, notes: 'Hinge at the hips, feel hamstring stretch.' },
        { id: 'd4e5', lib: 'Lying_Leg_Curls', name: 'Lying Leg Curls', sets: 3, reps: '10-12', rest: 60, weight: 0, step: 0.5, notes: 'Full contraction at the top.' }
      ]
    },
    {
      id: 'd5', name: 'Pull + Leg Extension', weekday: 5,
      exercises: [
        { id: 'd5e1', lib: 'Bent_Over_Barbell_Row', name: 'Barbell Rows', sets: 4, reps: '8-10', rest: 90, weight: 0, step: 0.5, notes: 'Hinge over and row to the belly button.' },
        { id: 'd5e2', lib: 'Seated_Cable_Rows', name: 'Seated Cable Rows', sets: 3, reps: '10-12', rest: 90, weight: 0, step: 0.5, notes: 'Keep chest up, do not use momentum.' },
        { id: 'd5e3', lib: 'Hammer_Curls', name: 'Hammer Curls', sets: 3, reps: '10-12', rest: 60, weight: 0, step: 0.5, notes: 'Target the brachialis.' },
        { id: 'd5e4', lib: 'Leg_Extensions', name: 'Leg Extensions', sets: 4, reps: '12-15', rest: 60, weight: 0, step: 0.5, notes: 'Pause and squeeze quads at the top.' },
        { id: 'd5e5', lib: 'Face_Pull', name: 'Face Pulls', sets: 3, reps: '12-15', rest: 60, weight: 0, step: 0.5, notes: 'Pull towards the face, external rotation.' }
      ]
    }
  ]
};
