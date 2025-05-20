import { useState } from 'react';
import { Lightbulb, ChefHat, Sparkles } from 'lucide-react';

const MediterraneanMealPlanner = () => {
  const [activeTab, setActiveTab] = useState('breakfast');
  const [breakfastIndex, setBreakfastIndex] = useState(0);
  const [dinnerIndex, setDinnerIndex] = useState(0);
  const [snackIndex, setSnackIndex] = useState(0);
  const [showTip, setShowTip] = useState(false);
  const [currentTip, setCurrentTip] = useState({});

  // Breakfast Options - Each ~300 calories
  const breakfasts = [
    {
      name: "Mediterranean Egg Cups",
      calories: 290,
      ingredients: [
        "2 eggs", 
        "Handful spinach", 
        "4 cherry tomatoes", 
        "1 tbsp crumbled feta", 
        "Fresh oregano", 
        "Olive oil spray"
      ],
      instructions: "Whisk eggs, add chopped spinach, tomatoes, and oregano. Pour into muffin tin, sprinkle with feta, and bake at 350°F for 15-18 minutes.",
      adaptationTip: "No muffin tin? Use a small oven-safe dish to make a mini frittata. No feta? Swap for any cheese you have or skip it completely.",
      nutritionTip: "Eggs provide high-quality protein that helps maintain muscle mass during calorie restriction."
    },
    {
      name: "Savory Greek Yogurt Bowl",
      calories: 280,
      ingredients: [
        "3/4 cup low-fat Greek yogurt", 
        "1/4 cucumber, diced", 
        "4 cherry tomatoes, halved", 
        "1 tsp olive oil", 
        "1/2 tsp za'atar spice", 
        "Small piece whole grain pita (1 oz)"
      ],
      instructions: "Top yogurt with diced cucumber, tomatoes, a drizzle of olive oil, and za'atar spice. Serve with a small piece of toasted pita.",
      adaptationTip: "No za'atar? Mix dried oregano, thyme, sesame seeds, and a pinch of sumac or lemon zest. No pita? Use any whole grain bread or skip it and add 1 tbsp nuts for crunch.",
      nutritionTip: "Greek yogurt provides nearly double the protein of regular yogurt, helping you stay full longer."
    },
    {
      name: "Avocado Toast with Egg",
      calories: 290,
      ingredients: [
        "1 slice whole grain bread", 
        "1/4 avocado", 
        "1 poached egg", 
        "Red pepper flakes", 
        "Salt and pepper to taste"
      ],
      instructions: "Toast bread, spread mashed avocado, top with poached egg and a sprinkle of red pepper flakes.",
      adaptationTip: "No fresh avocado? Use 2 tbsp hummus instead. Don't want to poach an egg? A fried egg with minimal oil or hard-boiled egg works too.",
      nutritionTip: "The healthy fats in avocado help your body absorb fat-soluble vitamins from your meals throughout the day."
    },
    {
      name: "Mini Shakshuka",
      calories: 295,
      ingredients: [
        "1 egg", 
        "1/2 cup tomato sauce", 
        "1/4 bell pepper, diced", 
        "1/4 onion, diced", 
        "1 garlic clove, minced", 
        "Cumin, paprika, chili flakes", 
        "Small piece whole grain bread (1 oz)"
      ],
      instructions: "Sauté onion, pepper, and garlic. Add tomato sauce and spices, simmer 5 minutes. Create a well, crack in egg, cover and cook until egg is set. Serve with bread for dipping.",
      adaptationTip: "No fresh bell peppers? Use roasted peppers from a jar or skip them and add extra tomatoes. Jarred pasta sauce works as a quick base - just add extra spices.",
      nutritionTip: "Tomatoes contain lycopene, an antioxidant that may help reduce inflammation and protect heart health."
    },
    {
      name: "Savory Mediterranean Oatmeal",
      calories: 280,
      ingredients: [
        "1/2 cup steel-cut oats, cooked", 
        "1/2 cup mushrooms, sliced", 
        "1/2 cup spinach", 
        "1 tsp olive oil", 
        "1 tbsp grated Parmesan", 
        "Fresh thyme", 
        "Black pepper"
      ],
      instructions: "Cook oats in water. Meanwhile, sauté mushrooms and spinach in olive oil with thyme. Top oats with vegetables and Parmesan cheese.",
      adaptationTip: "No steel-cut oats? Regular oats work fine, just reduce cooking liquid slightly. No mushrooms? Try zucchini, tomatoes, or any vegetable you have on hand.",
      nutritionTip: "Steel-cut oats digest more slowly than quick oats, providing steady energy throughout your morning."
    },
    {
      name: "Tomato & Herb Frittata Slice",
      calories: 300,
      ingredients: [
        "2 eggs", 
        "1 small tomato, sliced", 
        "1 tbsp fresh herbs (basil, parsley)", 
        "1 tbsp feta cheese", 
        "1 tsp olive oil", 
        "1 small fruit (like an apple or orange)"
      ],
      instructions: "Whisk eggs, pour into a small oiled pan, add tomato slices, herbs, and feta. Cook until almost set, then finish under the broiler. Serve with fruit.",
      adaptationTip: "You can make a larger frittata and save slices for future breakfasts - it reheats beautifully. Dried herbs work if you don't have fresh (use 1 tsp).",
      nutritionTip: "Eating protein at breakfast helps regulate hunger hormones throughout the day, potentially reducing overall calorie intake."
    },
    {
      name: "Mediterranean Breakfast Salad",
      calories: 285,
      ingredients: [
        "1 cup arugula", 
        "1 soft-boiled egg", 
        "4 olives, sliced", 
        "5 cherry tomatoes", 
        "1 tsp olive oil", 
        "Lemon juice", 
        "1 small slice whole grain bread (3/4 oz)"
      ],
      instructions: "Arrange arugula on plate, top with sliced soft-boiled egg, olives, and tomatoes. Drizzle with olive oil and lemon juice. Serve with toast.",
      adaptationTip: "Any greens work here - spinach, mixed greens, or even chopped romaine. No olives? Add a few capers or just increase the lemon and black pepper for flavor.",
      nutritionTip: "Starting your day with leafy greens provides folate and fiber while hydrating your body after overnight fasting."
    },
    {
      name: "White Bean & Herb Toast",
      calories: 305,
      ingredients: [
        "1/4 cup white beans, rinsed", 
        "1 tsp olive oil", 
        "1 small garlic clove, minced", 
        "Lemon zest", 
        "Fresh herbs (rosemary, thyme)", 
        "1 slice whole grain bread", 
        "Few cherry tomatoes"
      ],
      instructions: "Mash beans with olive oil, garlic, lemon zest and herbs. Spread on toasted bread and top with sliced tomatoes and black pepper.",
      adaptationTip: "Any canned beans work - try chickpeas or even lentils. If you don't have fresh garlic, a pinch of garlic powder works. This spread keeps well in the fridge for 3 days.",
      nutritionTip: "Beans provide a unique combination of protein and fiber that helps regulate blood sugar levels and provides sustained energy."
    }
  ];

  // Lunch Options - Each ~300 calories
  const lunches = [
    {
      name: "Greek Salad with Chickpeas",
      calories: 300,
      ingredients: [
        "2 cups mixed greens", 
        "1/2 cup chickpeas", 
        "1/4 cucumber", 
        "5 cherry tomatoes", 
        "1/4 red onion", 
        "2 tbsp feta cheese", 
        "5 kalamata olives", 
        "1 tsp olive oil", 
        "Lemon juice and oregano"
      ],
      instructions: "Combine all ingredients in a bowl, dress with olive oil, lemon juice, and oregano.",
      adaptationTip: "No chickpeas? Any bean works. For a portable option, layer ingredients in a jar with dressing at the bottom, greens on top.",
      nutritionTip: "This meal provides plant-based protein along with fiber and healthy fats to keep you satisfied through the afternoon."
    },
    {
      name: "Mediterranean Tuna Wrap",
      calories: 310,
      ingredients: [
        "1 small whole grain wrap (6-inch)", 
        "3 oz canned tuna in water", 
        "1 tsp olive oil", 
        "Lemon juice", 
        "1/4 cucumber, sliced", 
        "Few cherry tomatoes", 
        "Fresh herbs"
      ],
      instructions: "Mix tuna with olive oil and lemon juice. Fill wrap with tuna mixture and vegetables.",
      adaptationTip: "No wrap? Use lettuce leaves for a lower-carb option or serve as a salad with a side of whole grain crackers.",
      nutritionTip: "Tuna provides lean protein and omega-3 fatty acids, supporting brain health during calorie restriction."
    },
    {
      name: "Lentil Soup with Whole Grain Roll",
      calories: 295,
      ingredients: [
        "1 cup lentil and vegetable soup", 
        "1 small whole grain roll (1 oz)", 
        "Fresh herbs for garnish"
      ],
      instructions: "Heat soup, serve with roll. Garnish with fresh herbs.",
      adaptationTip: "Make a big batch of soup and freeze in single-serve portions. No lentils? Any bean soup works well.",
      nutritionTip: "Soup can help you feel full despite being lower in calories due to its high water content and fiber from vegetables."
    },
    {
      name: "Quinoa Mediterranean Bowl",
      calories: 305,
      ingredients: [
        "1/3 cup cooked quinoa", 
        "1/2 cup roasted vegetables (zucchini, bell pepper, eggplant)", 
        "1/4 cup chickpeas", 
        "1 tsp olive oil", 
        "1 tsp tahini", 
        "Lemon juice", 
        "Fresh herbs"
      ],
      instructions: "Arrange quinoa, roasted vegetables, and chickpeas in a bowl. Drizzle with olive oil, tahini, and lemon juice. Top with herbs.",
      adaptationTip: "Batch-cook quinoa and roasted vegetables on weekends. No quinoa? Use any whole grain like farro, bulgur, or brown rice.",
      nutritionTip: "Quinoa is a complete protein source, containing all essential amino acids your body needs."
    }
  ];

  // Snack Options - Each ~200 calories
  const snacks = [
    {
      name: "Greek Yogurt with Honey & Walnuts",
      calories: 190,
      ingredients: [
        "3/4 cup low-fat Greek yogurt", 
        "1 tsp honey", 
        "5 walnut halves, chopped"
      ],
      instructions: "Top yogurt with honey and walnuts.",
      adaptationTip: "No walnuts? Any nut works. No honey? Try a teaspoon of jam or a few pieces of chopped fruit.",
      nutritionTip: "The protein in Greek yogurt paired with the healthy fats in walnuts helps manage hunger between meals."
    },
    {
      name: "Hummus with Vegetable Sticks",
      calories: 180,
      ingredients: [
        "1/4 cup hummus", 
        "1 cup mixed vegetable sticks (carrots, cucumber, bell pepper)"
      ],
      instructions: "Serve hummus with raw vegetable sticks for dipping.",
      adaptationTip: "No time to cut veggies? Pre-cut vegetables or even a few whole grain crackers work. Out of hummus? Tzatziki or even mashed avocado with lemon juice makes a good substitute.",
      nutritionTip: "The fiber from the vegetables and protein/fat from the hummus creates a balanced snack that won't spike blood sugar."
    },
    {
      name: "Mediterranean Trail Mix",
      calories: 200,
      ingredients: [
        "10 almonds", 
        "5 walnut halves", 
        "1 tbsp pumpkin seeds", 
        "1 tbsp dried apricots (no sugar added)", 
        "1 tsp dark chocolate chips"
      ],
      instructions: "Mix all ingredients together and store in a small container for an on-the-go snack.",
      adaptationTip: "Use whatever nuts and seeds you have on hand - the key is portion control. Dried fruit can be substituted with any variety without added sugar.",
      nutritionTip: "This mix provides healthy fats, protein, and a touch of natural sweetness to satisfy cravings while providing sustainable energy."
    },
    {
      name: "Tomato & Mozzarella Skewer",
      calories: 190,
      ingredients: [
        "1 oz fresh mozzarella (small balls)", 
        "8 cherry tomatoes", 
        "Fresh basil leaves", 
        "Balsamic vinegar drizzle", 
        "Black pepper"
      ],
      instructions: "Alternate cherry tomatoes, mozzarella balls, and basil leaves on skewers. Drizzle with balsamic vinegar and add black pepper.",
      adaptationTip: "No skewers? Simply make it a small salad. No fresh mozzarella? A sprinkle of feta or any cheese works, just adjust quantity to maintain calories.",
      nutritionTip: "The combination of protein from cheese and antioxidants from tomatoes makes this a nutritionally balanced snack."
    }
  ];

  // Dinner Options - Each ~400 calories
  const dinners = [
    {
      name: "Grilled Fish with Roasted Vegetables",
      calories: 390,
      ingredients: [
        "4 oz white fish (cod, tilapia)", 
        "1 cup mixed vegetables (zucchini, bell pepper, red onion)", 
        "1 tsp olive oil", 
        "Lemon juice", 
        "Fresh herbs (oregano, thyme)", 
        "1/3 cup cooked quinoa"
      ],
      instructions: "Season fish with herbs, grill or bake. Toss vegetables with olive oil and roast at 400°F for 20 minutes. Serve with quinoa.",
      adaptationTip: "No fresh fish? Use frozen or even canned in a pinch. No quinoa? Any whole grain works, or increase vegetables for a lower-carb option.",
      nutritionTip: "Fish provides lean protein and anti-inflammatory omega-3 fatty acids that support heart health and brain function."
    },
    {
      name: "Mediterranean Chicken Souvlaki",
      calories: 400,
      ingredients: [
        "3 oz chicken breast", 
        "Lemon juice", 
        "Garlic, oregano", 
        "2 cups Greek salad (cucumber, tomato, red onion, minimal feta)", 
        "1/2 small whole wheat pita"
      ],
      instructions: "Marinate chicken in lemon juice, garlic, and oregano. Grill or bake. Serve with Greek salad and pita.",
      adaptationTip: "Cook extra chicken for future meals. No time to marinate? Use dried herbs and a quick squeeze of lemon before cooking. No pita? Serve over a bed of greens.",
      nutritionTip: "Lean protein from chicken helps preserve muscle mass during calorie restriction, which keeps your metabolism functioning efficiently."
    },
    {
      name: "Lentil & Vegetable Stew",
      calories: 380,
      ingredients: [
        "1/2 cup cooked lentils", 
        "1 cup mixed vegetables (diced tomatoes, onions, carrots, celery)", 
        "Garlic, bay leaf, cumin", 
        "1 tsp olive oil", 
        "1 small whole grain roll (1 oz)"
      ],
      instructions: "Sauté onions and garlic in olive oil. Add vegetables, lentils, and spices. Simmer until vegetables are tender. Serve with roll.",
      adaptationTip: "Make a large batch and freeze portions. No lentils? Any beans work well. Add a pinch of smoked paprika if you like a deeper flavor.",
      nutritionTip: "Lentils are rich in resistant starch, which feeds beneficial gut bacteria and may improve metabolism."
    },
    {
      name: "Eggplant & Chickpea Skillet",
      calories: 400,
      ingredients: [
        "1 cup eggplant, cubed", 
        "1/2 cup tomatoes, diced", 
        "1/4 cup onion, diced", 
        "1/2 cup chickpeas", 
        "Garlic, cumin, paprika", 
        "1 tsp olive oil", 
        "1 tbsp tahini", 
        "1/3 cup cooked bulgur"
      ],
      instructions: "Sauté eggplant, onions, and garlic in olive oil. Add tomatoes, chickpeas, and spices. Cook until eggplant is tender. Drizzle with tahini and serve with bulgur.",
      adaptationTip: "Not a fan of eggplant? Zucchini or bell peppers work well too. No bulgur? Any whole grain or even cauliflower 'rice' for a lower-carb option.",
      nutritionTip: "Eggplant contains nasunin, an antioxidant that helps protect brain cell membranes and assists with overall brain health."
    },
    {
      name: "Stuffed Bell Pepper",
      calories: 390,
      ingredients: [
        "1 large bell pepper", 
        "1/3 cup cooked quinoa", 
        "1/4 cup diced vegetables (zucchini, onion)", 
        "2 oz lean ground turkey", 
        "Italian herbs, garlic", 
        "1 tbsp crumbled feta", 
        "Side salad with 1 tsp olive oil dressing"
      ],
      instructions: "Brown turkey with vegetables and herbs. Mix with cooked quinoa. Stuff into bell pepper. Bake at 375°F for 20-25 minutes. Top with feta and serve with side salad.",
      adaptationTip: "No bell peppers? Use zucchini boats, tomatoes, or make it a bowl. No ground turkey? Use lentils for a vegetarian version.",
      nutritionTip: "Bell peppers are high in vitamin C, which helps your body absorb the iron from the turkey and quinoa."
    },
    {
      name: "Mediterranean Buddha Bowl",
      calories: 400,
      ingredients: [
        "1/3 cup cooked farro", 
        "3 oz baked salmon", 
        "1 cup roasted vegetables", 
        "2-3 olives, chopped", 
        "1 tsp tahini", 
        "Lemon juice", 
        "Fresh herbs"
      ],
      instructions: "Arrange farro, salmon, and vegetables in a bowl. Top with chopped olives, a drizzle of tahini-lemon sauce, and fresh herbs.",
      adaptationTip: "Meal prep components separately and assemble for quick dinners. No salmon? Any protein works. No farro? Use any whole grain or omit for a lower-carb meal.",
      nutritionTip: "This balanced bowl provides omega-3 fatty acids from salmon, complex carbs from farro, and a variety of nutrients from colorful vegetables."
    },
    {
      name: "Zucchini Noodles with Shrimp",
      calories: 380,
      ingredients: [
        "2 medium zucchini, spiralized", 
        "3 oz shrimp", 
        "1 garlic clove, minced", 
        "1/2 cup tomato sauce", 
        "Fresh basil", 
        "1 tsp olive oil", 
        "1 tbsp grated Parmesan"
      ],
      instructions: "Sauté garlic in olive oil. Add shrimp, cook until pink. Add tomato sauce and simmer. Toss with zucchini noodles until just softened. Top with Parmesan and basil.",
      adaptationTip: "No spiralizer? Use a vegetable peeler to make ribbons or simply dice the zucchini. No fresh shrimp? Frozen works well, or substitute any protein.",
      nutritionTip: "This low-carb option provides lean protein from shrimp while the zucchini offers volume and fiber to help you feel satisfied with fewer calories."
    },
    {
      name: "Vegetable Bean Paella",
      calories: 400,
      ingredients: [
        "1/3 cup arborio rice", 
        "Pinch saffron (optional)", 
        "1/2 cup mixed vegetables (bell peppers, peas, tomatoes)", 
        "1/4 cup white beans", 
        "1 tsp olive oil", 
        "Garlic, paprika, turmeric", 
        "Vegetable broth"
      ],
      instructions: "Sauté rice with olive oil. Add spices and broth, simmer for 15 minutes. Add vegetables and beans, continue cooking until rice is tender and liquid is absorbed.",
      adaptationTip: "No saffron? Use turmeric for color and a pinch of smoked paprika for flavor. No arborio rice? Any short-grain rice works, or even cauliflower rice for a low-carb version.",
      nutritionTip: "This plant-forward meal provides complex carbohydrates for energy along with plant protein from beans for sustained fullness."
    }
  ];

  const tips = [
    {
      title: "Calorie-Saving Swaps",
      content: "• Use vegetable broth instead of oil for sautéing (saves 120 calories per tablespoon)\n• Try vinegar-based dressings instead of oil-based ones (saves ~100 calories)\n• Use herbs, spices, and citrus to add flavor without calories\n• Choose leaner proteins like fish and legumes over red meat\n• Use yogurt instead of mayo or sour cream in dips and spreads"
    },
    {
      title: "Meal Prep Strategies",
      content: "• Roast a big batch of vegetables on weekends to use throughout the week\n• Cook grains and legumes in bulk and freeze in portion-sized containers\n• Prep breakfast egg cups for the entire week\n• Wash and chop vegetables as soon as you get home from shopping\n• Make large batches of soups and stews to portion and freeze"
    },
    {
      title: "Mediterranean Diet Principles",
      content: "• Focus on plant foods (fruits, vegetables, whole grains, legumes)\n• Use olive oil as your primary fat source\n• Eat fish at least twice weekly\n• Limit red meat to once or twice monthly\n• Include moderate amounts of dairy (mainly yogurt and cheese)\n• Season with herbs and spices instead of salt\n• Enjoy meals with family and friends when possible"
    },
    {
      title: "Managing Hunger on 1200 Calories",
      content: "• Eat protein at every meal and snack to increase satiety\n• Choose high-fiber foods that digest slowly\n• Stay well-hydrated throughout the day\n• Eat slowly and mindfully to recognize fullness cues\n• Include healthy fats in small amounts to increase satisfaction\n• Volume eat with low-calorie vegetables to physically fill your stomach"
    }
  ];

  const handleShowTip = (tip) => {
    setCurrentTip(tip);
    setShowTip(true);
  };

  const calculateDailyCalories = () => {
    return breakfasts[breakfastIndex].calories + 
           lunches[0].calories + 
           snacks[snackIndex].calories + 
           dinners[dinnerIndex].calories;
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Mediterranean 1200-Calorie Meal Planner</h1>
          <p className="text-gray-500 text-lg">Delicious, flexible meals for your calorie deficit journey</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 self-end">
          <span className="text-sm py-2 px-4 rounded-full bg-gray-50 border border-gray-200 font-medium">
            Daily Total: {calculateDailyCalories()} calories
          </span>
          <span className={`text-sm py-2 px-4 rounded-full font-medium ${
            calculateDailyCalories() <= 1200 
              ? "bg-green-50 text-green-700 border border-green-200" 
              : "bg-red-50 text-red-700 border border-red-200"
          }`}>
            {calculateDailyCalories() <= 1200 ? "On Target ✓" : "Over Budget ⚠️"}
          </span>
        </div>
      </div>

      {/* Custom Tabs */}
      <div className="border-b-2 border-gray-100">
        <div className="flex space-x-1 md:space-x-4">
          {['breakfast', 'lunch', 'snacks', 'dinner'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 px-6 font-medium text-sm md:text-base focus:outline-none transition-colors duration-200 ${
                activeTab === tab
                  ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50 rounded-t-lg'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-t-lg'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>
      
      {/* Tab Content */}
      <div className="pt-2 pb-6">
        {/* Breakfast Tab */}
        {activeTab === 'breakfast' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <h2 className="text-xl md:text-2xl font-semibold text-gray-800">Savory Mediterranean Breakfasts</h2>
              <select 
                value={breakfastIndex}
                onChange={(e) => setBreakfastIndex(parseInt(e.target.value))}
                className="border border-gray-300 rounded-lg px-4 py-2.5 w-full md:w-72 text-gray-700 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
              >
                {breakfasts.map((breakfast, index) => (
                  <option key={index} value={index}>
                    {breakfast.name} ({breakfast.calories} cal)
                  </option>
                ))}
              </select>
            </div>
            
            <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <div className="p-5 border-b border-gray-200 bg-gray-50">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg md:text-xl font-semibold text-gray-800">{breakfasts[breakfastIndex].name}</h3>
                  <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1.5 rounded-full">
                    {breakfasts[breakfastIndex].calories} calories
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">Mediterranean-inspired savory breakfast (~300 calories)</p>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-5">
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-800 text-base border-b border-gray-100 pb-2">Ingredients</h4>
                      <ul className="text-sm space-y-2 text-gray-600">
                        {breakfasts[breakfastIndex].ingredients.map((ingredient, i) => (
                          <li key={i} className="flex items-start">
                            <span className="text-blue-500 mr-2">•</span> {ingredient}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-800 text-base border-b border-gray-100 pb-2">Instructions</h4>
                      <p className="text-sm text-gray-600 leading-relaxed">{breakfasts[breakfastIndex].instructions}</p>
                    </div>
                  </div>
                  <div className="space-y-5">
                    <div className="flex items-start gap-3 bg-amber-50 p-4 rounded-lg border border-amber-200">
                      <Lightbulb className="h-5 w-5 text-amber-600 mt-1 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium text-amber-800 text-base mb-1.5">Adaptation Tip</h4>
                        <p className="text-sm text-amber-700 leading-relaxed">{breakfasts[breakfastIndex].adaptationTip}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 bg-green-50 p-4 rounded-lg border border-green-200">
                      <Sparkles className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium text-green-800 text-base mb-1.5">Nutrition Insight</h4>
                        <p className="text-sm text-green-700 leading-relaxed">{breakfasts[breakfastIndex].nutritionTip}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Lunch Tab */}
        {activeTab === 'lunch' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl md:text-2xl font-semibold text-gray-800">Mediterranean Lunch Options</h2>
              <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1.5 rounded-full">
                300 calories each
              </span>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              {lunches.map((lunch, index) => (
                <div key={index} className="border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
                  <div className="p-5 border-b border-gray-200 bg-gray-50">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold text-gray-800">{lunch.name}</h3>
                      <span className="text-xs text-gray-600 border border-gray-200 px-2.5 py-1 rounded-full font-medium">
                        {lunch.calories} cal
                      </span>
                    </div>
                  </div>
                  <div className="p-5">
                    <p className="text-sm text-gray-600 leading-relaxed">{lunch.adaptationTip}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Snacks Tab */}
        {activeTab === 'snacks' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <h2 className="text-xl md:text-2xl font-semibold text-gray-800">Mediterranean Snacks</h2>
              <select 
                value={snackIndex}
                onChange={(e) => setSnackIndex(parseInt(e.target.value))}
                className="border border-gray-300 rounded-lg px-4 py-2.5 w-full md:w-72 text-gray-700 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
              >
                {snacks.map((snack, index) => (
                  <option key={index} value={index}>
                    {snack.name} ({snack.calories} cal)
                  </option>
                ))}
              </select>
            </div>
            
            <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <div className="p-5 border-b border-gray-200 bg-gray-50">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg md:text-xl font-semibold text-gray-800">{snacks[snackIndex].name}</h3>
                  <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1.5 rounded-full">
                    {snacks[snackIndex].calories} calories
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">Quick, satisfying Mediterranean snack (~200 calories)</p>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-5">
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-800 text-base border-b border-gray-100 pb-2">Ingredients</h4>
                      <ul className="text-sm space-y-2 text-gray-600">
                        {snacks[snackIndex].ingredients.map((ingredient, i) => (
                          <li key={i} className="flex items-start">
                            <span className="text-blue-500 mr-2">•</span> {ingredient}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-800 text-base border-b border-gray-100 pb-2">Instructions</h4>
                      <p className="text-sm text-gray-600 leading-relaxed">{snacks[snackIndex].instructions}</p>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-start gap-3 bg-amber-50 p-4 rounded-lg border border-amber-200">
                      <Lightbulb className="h-5 w-5 text-amber-600 mt-1 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium text-amber-800 text-base mb-1.5">Adaptation Tip</h4>
                        <p className="text-sm text-amber-700 leading-relaxed">{snacks[snackIndex].adaptationTip}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Dinner Tab */}
        {activeTab === 'dinner' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <h2 className="text-xl md:text-2xl font-semibold text-gray-800">Mediterranean Dinners</h2>
              <select 
                value={dinnerIndex}
                onChange={(e) => setDinnerIndex(parseInt(e.target.value))}
                className="border border-gray-300 rounded-lg px-4 py-2.5 w-full md:w-72 text-gray-700 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
              >
                {dinners.map((dinner, index) => (
                  <option key={index} value={index}>
                    {dinner.name} ({dinner.calories} cal)
                  </option>
                ))}
              </select>
            </div>
            
            <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <div className="p-5 border-b border-gray-200 bg-gray-50">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg md:text-xl font-semibold text-gray-800">{dinners[dinnerIndex].name}</h3>
                  <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1.5 rounded-full">
                    {dinners[dinnerIndex].calories} calories
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">Satisfying Mediterranean dinner (~400 calories)</p>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-5">
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-800 text-base border-b border-gray-100 pb-2">Ingredients</h4>
                      <ul className="text-sm space-y-2 text-gray-600">
                        {dinners[dinnerIndex].ingredients.map((ingredient, i) => (
                          <li key={i} className="flex items-start">
                            <span className="text-blue-500 mr-2">•</span> {ingredient}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-800 text-base border-b border-gray-100 pb-2">Instructions</h4>
                      <p className="text-sm text-gray-600 leading-relaxed">{dinners[dinnerIndex].instructions}</p>
                    </div>
                  </div>
                  <div className="space-y-5">
                    <div className="flex items-start gap-3 bg-amber-50 p-4 rounded-lg border border-amber-200">
                      <Lightbulb className="h-5 w-5 text-amber-600 mt-1 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium text-amber-800 text-base mb-1.5">Adaptation Tip</h4>
                        <p className="text-sm text-amber-700 leading-relaxed">{dinners[dinnerIndex].adaptationTip}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 bg-green-50 p-4 rounded-lg border border-green-200">
                      <Sparkles className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium text-green-800 text-base mb-1.5">Nutrition Insight</h4>
                        <p className="text-sm text-green-700 leading-relaxed">{dinners[dinnerIndex].nutritionTip}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Tips Section */}
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Helpful Mediterranean Diet Tips</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {tips.map((tip, index) => (
          <div 
            key={index} 
            className="border border-gray-200 rounded-xl overflow-hidden cursor-pointer hover:shadow-md transition-all duration-200 hover:border-blue-200" 
            onClick={() => handleShowTip(tip)}
          >
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-base font-semibold text-gray-800">{tip.title}</h3>
            </div>
            <div className="p-4 bg-white">
              <p className="text-sm text-gray-500 flex items-center gap-1.5">
                <span>Click to view tips</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </p>
            </div>
          </div>
        ))}
      </div>
      
      {/* Tip Modal */}
      {showTip && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full shadow-xl">
            <div className="p-6 border-b border-gray-200">
              <h3 className="font-bold text-xl text-gray-800">{currentTip.title}</h3>
            </div>
            <div className="p-6">
              <div className="whitespace-pre-line text-sm text-gray-600 leading-relaxed">
                {currentTip.content}
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-b-xl flex justify-end">
              <button 
                onClick={() => setShowTip(false)}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Footer */}
      <div className="p-6 bg-blue-50 rounded-xl border border-blue-200 shadow-sm">
        <h3 className="font-semibold text-lg mb-3 flex items-center text-blue-900">
          <ChefHat className="inline mr-2.5 h-5 w-5 text-blue-600" />
          Mediterranean Diet: Flexibility Is Key
        </h3>
        <p className="text-sm text-blue-800 leading-relaxed">
          This meal plan is designed to be adaptable to your preferences, schedule, and available ingredients. 
          Mix and match components while keeping within your calorie goals. The Mediterranean diet is a lifestyle, 
          not a rigid diet—focus on the principles of plant-forward eating, healthy fats, and mindful portions rather 
          than perfect adherence to specific recipes.
        </p>
      </div>
    </div>
  );
};

export default MediterraneanMealPlanner;
