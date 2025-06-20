import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, Users, ChefHat, Heart, Leaf, Star, Calendar, ShoppingCart, Globe, CheckCircle } from 'lucide-react';

const MediterraneanLatinoRecipesEnglish = () => {
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState('breakfast');

  const recipeCategories = {
    breakfast: {
      title: "Mediterranean Breakfasts",
      icon: <ChefHat className="h-5 w-5" />,
      color: "bg-yellow-100 text-yellow-800"
    },
    lunch: {
      title: "Healthy Lunches", 
      icon: <Heart className="h-5 w-5" />,
      color: "bg-green-100 text-green-800"
    },
    dinner: {
      title: "Nutritious Dinners",
      icon: <Star className="h-5 w-5" />,
      color: "bg-blue-100 text-blue-800"
    },
    snacks: {
      title: "Smart Snacks",
      icon: <Leaf className="h-5 w-5" />,
      color: "bg-purple-100 text-purple-800"
    }
  };

  const recipes = {
    breakfast: [
      {
        name: "Cinnamon Walnut Oatmeal",
        description: "Mediterranean-style oatmeal with cinnamon, walnuts, and fresh berries (Avena con Canela y Nueces)",
        prepTime: "10 min",
        servings: 2,
        fiber: "8g",
        satFat: "2g",
        ingredients: [
          "1 cup steel-cut oats",
          "2 cups low-fat milk or plant-based milk",
          "1 tsp ground cinnamon",
          "1/4 cup chopped walnuts",
          "1/2 cup fresh berries (blueberries or strawberries)",
          "1 tbsp honey or agave",
          "1 tsp vanilla extract"
        ],
        instructions: [
          "Cook oats according to package directions using low-fat milk",
          "Stir in cinnamon and vanilla extract",
          "Top with chopped walnuts, fresh berries, and a drizzle of honey",
          "Serve warm in bowls"
        ],
        culturalNote: "Inspired by traditional Mexican canela (cinnamon) but with Mediterranean nuts and antioxidant-rich fruits",
        healthBenefits: ["High fiber for blood sugar control", "Omega-3 fatty acids from walnuts", "Antioxidants from fresh berries"],
        researchConnection: "This recipe supports the study's fiber goals while using familiar flavors"
      },
      {
        name: "Mediterranean Huevos Rancheros",
        description: "Traditional huevos rancheros with olive oil, herbs, and whole grain tortillas",
        prepTime: "15 min",
        servings: 2,
        fiber: "6g",
        satFat: "3g",
        ingredients: [
          "2 whole grain tortillas",
          "2 large eggs",
          "1/4 cup black beans, drained and rinsed",
          "2 tbsp extra virgin olive oil",
          "1/4 cup salsa verde (low sodium)",
          "1/4 avocado, sliced",
          "2 tbsp fresh cilantro, chopped",
          "1 tbsp fresh lime juice",
          "Salt and pepper to taste"
        ],
        instructions: [
          "Heat 1 tbsp olive oil in non-stick pan over medium heat",
          "Warm tortillas and beans separately",
          "Fry eggs in remaining olive oil until whites are set but yolks are still slightly runny",
          "Place eggs on warm tortillas, add heated beans and salsa verde",
          "Top with avocado slices, fresh cilantro, and a squeeze of lime",
          "Serve immediately while hot"
        ],
        culturalNote: "Maintains traditional Mexican flavors while using heart-healthy olive oil instead of lard",
        healthBenefits: ["Complete protein from eggs and beans", "Healthy monounsaturated fats from olive oil and avocado", "Fiber from whole grain tortillas"],
        researchConnection: "Demonstrates the study's principle of maintaining cultural foods while improving nutritional profile"
      },
      {
        name: "Tropical Quinoa Breakfast Bowl",
        description: "Protein-rich quinoa bowl with tropical fruits and nuts",
        prepTime: "12 min",
        servings: 2,
        fiber: "7g",
        satFat: "1g",
        ingredients: [
          "1 cup cooked quinoa, cooled",
          "1/2 cup diced mango",
          "1/2 cup diced pineapple",
          "1/4 cup chopped almonds",
          "2 tbsp shredded coconut (unsweetened)",
          "1 tbsp chia seeds",
          "1 tbsp lime juice",
          "1 tsp honey",
          "1/2 tsp vanilla extract"
        ],
        instructions: [
          "Mix cooked quinoa with vanilla extract in a bowl",
          "Combine mango, pineapple, lime juice, and honey",
          "Top quinoa with fruit mixture",
          "Sprinkle with almonds, coconut, and chia seeds",
          "Serve chilled or at room temperature"
        ],
        culturalNote: "Combines ancient Andean quinoa with tropical fruits familiar in Latino cuisine",
        healthBenefits: ["Complete protein from quinoa", "Vitamin C from tropical fruits", "Healthy fats from nuts and seeds"],
        researchConnection: "Provides plant-based protein while incorporating culturally familiar tropical flavors"
      }
    ],
    lunch: [
      {
        name: "Black Bean Quinoa Salad",
        description: "Protein-rich quinoa salad with black beans, vegetables, and lime-olive oil dressing",
        prepTime: "20 min",
        servings: 4,
        fiber: "12g",
        satFat: "1g",
        ingredients: [
          "1 cup quinoa, cooked and cooled",
          "1 cup black beans, drained and rinsed",
          "1 red bell pepper, diced",
          "1/2 red onion, finely chopped",
          "1 cucumber, diced",
          "1/4 cup extra virgin olive oil",
          "2 limes, juiced",
          "1/4 cup fresh cilantro, chopped",
          "1 tsp ground cumin",
          "1/2 tsp smoked paprika",
          "Salt and pepper to taste"
        ],
        instructions: [
          "Combine cooked quinoa and black beans in large serving bowl",
          "Add diced bell pepper, onion, and cucumber",
          "Whisk together olive oil, lime juice, cumin, paprika, salt, and pepper",
          "Pour dressing over salad and toss well to combine",
          "Add fresh cilantro and toss again",
          "Chill for at least 30 minutes before serving to allow flavors to meld"
        ],
        culturalNote: "Combines ancient Andean quinoa with Mexican-style black beans and traditional seasonings",
        healthBenefits: ["Complete protein from quinoa", "High fiber content for blood sugar control", "Heart-healthy olive oil and antioxidants"],
        researchConnection: "This recipe exemplifies the study's success in achieving high fiber intake (12g per serving)"
      },
      {
        name: "Mediterranean Chicken Soup",
        description: "Chicken soup with Mediterranean vegetables, white beans, and olive oil (Caldo de Pollo Mediterráneo)",
        prepTime: "45 min",
        servings: 6,
        fiber: "5g",
        satFat: "2g",
        ingredients: [
          "1 lb skinless chicken breast, diced",
          "2 tbsp extra virgin olive oil",
          "1 large onion, chopped",
          "2 carrots, sliced",
          "2 celery stalks, chopped",
          "3 garlic cloves, minced",
          "6 cups low-sodium chicken broth",
          "1 cup cannellini beans, drained and rinsed",
          "2 cups fresh spinach",
          "1 tsp dried oregano",
          "1/2 cup fresh parsley, chopped",
          "Lemon juice to taste",
          "Salt and pepper to taste"
        ],
        instructions: [
          "Heat olive oil in large soup pot over medium heat",
          "Add diced chicken and cook until lightly browned on all sides",
          "Add onion, carrots, celery, and garlic; cook for 5 minutes until softened",
          "Pour in chicken broth, add cannellini beans and oregano",
          "Bring to a boil, then reduce heat and simmer for 20 minutes",
          "Stir in spinach and fresh parsley in the last 2 minutes of cooking",
          "Season with lemon juice, salt, and pepper to taste"
        ],
        culturalNote: "Traditional Latin American caldo concept enhanced with Mediterranean white beans and olive oil",
        healthBenefits: ["Lean protein from chicken", "Nutrient-dense vegetables", "Anti-inflammatory properties from olive oil"],
        researchConnection: "Demonstrates how traditional comfort foods can be adapted to meet Mediterranean dietary principles"
      },
      {
        name: "Lentil and Vegetable Power Bowl",
        description: "Nutrient-dense bowl with lentils, roasted vegetables, and tahini dressing",
        prepTime: "35 min",
        servings: 3,
        fiber: "14g",
        satFat: "1g",
        ingredients: [
          "1 cup green or brown lentils",
          "2 cups mixed vegetables (zucchini, bell peppers, red onion)",
          "2 tbsp olive oil",
          "1 tsp cumin",
          "1 tsp smoked paprika",
          "2 tbsp tahini",
          "1 lemon, juiced",
          "1 garlic clove, minced",
          "2 cups mixed greens",
          "1/4 cup pumpkin seeds",
          "Salt and pepper to taste"
        ],
        instructions: [
          "Cook lentils according to package directions, drain and set aside",
          "Preheat oven to 425°F",
          "Toss vegetables with 1 tbsp olive oil, cumin, and paprika",
          "Roast vegetables for 20 minutes until tender",
          "Whisk together tahini, lemon juice, garlic, and remaining olive oil",
          "Serve lentils and roasted vegetables over mixed greens",
          "Drizzle with tahini dressing and top with pumpkin seeds"
        ],
        culturalNote: "Plant-based protein bowl incorporating Middle Eastern tahini with Latino spice preferences",
        healthBenefits: ["Exceptional fiber content", "Plant-based complete protein", "Antioxidants from colorful vegetables"],
        researchConnection: "Exceeds the study's fiber targets while providing satisfying, culturally-adapted flavors"
      }
    ],
    dinner: [
      {
        name: "Baked Fish with Roasted Vegetables",
        description: "Mediterranean-style baked fish with seasonal roasted vegetables and herbs",
        prepTime: "30 min",
        servings: 4,
        fiber: "7g",
        satFat: "2g",
        ingredients: [
          "4 white fish fillets (tilapia, cod, or mahi-mahi)",
          "2 medium zucchini, sliced",
          "1 medium eggplant, cubed",
          "2 large tomatoes, chopped",
          "1/4 cup extra virgin olive oil",
          "3 garlic cloves, minced",
          "1 tsp dried oregano",
          "1 tsp smoked paprika",
          "1/2 cup fresh parsley, chopped",
          "1 lemon, cut into wedges",
          "Salt and pepper to taste"
        ],
        instructions: [
          "Preheat oven to 400°F",
          "Toss zucchini, eggplant, and tomatoes with 2 tbsp olive oil, garlic, and oregano",
          "Arrange vegetables on large baking sheet and bake for 15 minutes",
          "Season fish fillets with paprika, salt, pepper, and remaining olive oil",
          "Add fish to the baking sheet with vegetables",
          "Bake for an additional 12-15 minutes until fish flakes easily",
          "Garnish with fresh parsley and serve with lemon wedges"
        ],
        culturalNote: "Pescado preparation common in coastal Latin regions using Mediterranean cooking methods",
        healthBenefits: ["Omega-3 fatty acids from fish", "High vegetable content", "Very low saturated fat content"],
        researchConnection: "Supports the study's goal of incorporating fish 2-3 times weekly for heart health"
      },
      {
        name: "Mediterranean-Style Mole Chicken",
        description: "Lighter version of traditional mole using Mediterranean ingredients and techniques",
        prepTime: "40 min",
        servings: 6,
        fiber: "4g",
        satFat: "3g",
        ingredients: [
          "6 skinless chicken thighs",
          "2 tbsp extra virgin olive oil",
          "1 large onion, chopped",
          "2 large tomatoes, chopped",
          "2 tbsp ground almonds",
          "1 tbsp sesame seeds",
          "1 tsp ground cinnamon",
          "1/2 tsp ground cumin",
          "1 oz dark chocolate (70% cacao)",
          "2 cups low-sodium chicken broth",
          "1 tsp chipotle powder",
          "Brown rice for serving",
          "Salt to taste"
        ],
        instructions: [
          "Heat olive oil in large heavy-bottomed pot over medium-high heat",
          "Brown chicken thighs on all sides, about 6 minutes total, then remove",
          "In the same pot, sauté onion until soft and translucent",
          "Add chopped tomatoes and cook until they break down, about 8 minutes",
          "Stir in ground almonds, sesame seeds, cinnamon, cumin, and chipotle powder",
          "Add chicken broth and dark chocolate, whisking until chocolate melts",
          "Return chicken to pot, cover and simmer for 25 minutes",
          "Serve over brown rice with sauce spooned over chicken"
        ],
        culturalNote: "Traditional mole flavors adapted with Mediterranean nuts and reduced fat content",
        healthBenefits: ["Lean protein from chicken", "Antioxidants from dark chocolate", "Heart-healthy nuts and olive oil"],
        researchConnection: "Demonstrates how beloved traditional recipes can be modified while maintaining authentic flavors"
      },
      {
        name: "Stuffed Bell Peppers with Quinoa",
        description: "Colorful bell peppers stuffed with quinoa, vegetables, and beans",
        prepTime: "45 min",
        servings: 4,
        fiber: "9g",
        satFat: "1g",
        ingredients: [
          "4 large bell peppers (any color), tops cut and seeds removed",
          "1 cup cooked quinoa",
          "1/2 cup black beans, drained and rinsed",
          "1/2 cup corn kernels",
          "1/4 cup diced onion",
          "2 tbsp olive oil",
          "1 tsp cumin",
          "1 tsp chili powder",
          "1/4 cup chopped cilantro",
          "1/4 cup low-fat cheese, grated (optional)",
          "Lime wedges for serving"
        ],
        instructions: [
          "Preheat oven to 375°F",
          "Heat 1 tbsp olive oil in pan, sauté onion until soft",
          "Mix quinoa, black beans, corn, sautéed onion, cumin, and chili powder",
          "Stuff bell peppers with quinoa mixture",
          "Drizzle with remaining olive oil",
          "Bake for 30 minutes until peppers are tender",
          "Top with cheese if using, bake 5 more minutes",
          "Garnish with cilantro and serve with lime wedges"
        ],
        culturalNote: "Classic stuffed pepper concept with Latin American flavors and Mediterranean quinoa",
        healthBenefits: ["Complete protein from quinoa", "High fiber content", "Colorful antioxidants from peppers"],
        researchConnection: "Provides plant-based nutrition while incorporating familiar Latin flavors and spices"
      }
    ],
    snacks: [
      {
        name: "Spiced Vegetable Hummus",
        description: "Homemade hummus with Latin spices served with fresh vegetables",
        prepTime: "15 min",
        servings: 8,
        fiber: "4g",
        satFat: "0.5g",
        ingredients: [
          "1 can (15 oz) chickpeas, drained and rinsed",
          "2 tbsp tahini",
          "2 tbsp extra virgin olive oil",
          "1 lime, juiced",
          "2 garlic cloves",
          "1 tsp ground cumin",
          "1/2 tsp chili powder",
          "1/4 tsp smoked paprika",
          "Bell pepper strips for dipping",
          "Cucumber slices for dipping",
          "Jicama sticks for dipping",
          "Salt to taste"
        ],
        instructions: [
          "Combine chickpeas, tahini, olive oil, and lime juice in food processor",
          "Add garlic, cumin, chili powder, and paprika",
          "Process until smooth, adding water 1 tbsp at a time if needed for consistency",
          "Taste and adjust seasoning with salt",
          "Serve with fresh vegetable sticks for dipping",
          "Garnish with a drizzle of olive oil and extra paprika"
        ],
        culturalNote: "Mediterranean hummus enhanced with Mexican-inspired spices and served with jicama",
        healthBenefits: ["Plant-based protein and fiber", "Healthy fats from tahini and olive oil", "Low glycemic index for blood sugar control"],
        researchConnection: "Provides healthy snacking option that supports the study's fiber and healthy fat goals"
      },
      {
        name: "Chili-Lime Roasted Almonds",
        description: "Heart-healthy roasted almonds with chili powder and lime zest",
        prepTime: "10 min",
        servings: 4,
        fiber: "3g",
        satFat: "1g",
        ingredients: [
          "1 cup raw almonds",
          "1 tsp extra virgin olive oil",
          "1 tsp chili powder",
          "1/2 tsp lime zest",
          "1/4 tsp sea salt",
          "Pinch of cayenne pepper (optional)"
        ],
        instructions: [
          "Preheat oven to 350°F",
          "Toss almonds with olive oil in mixing bowl",
          "Mix chili powder, lime zest, salt, and cayenne in small bowl",
          "Sprinkle spice mixture over almonds and toss to coat evenly",
          "Spread on baking sheet and roast for 8-10 minutes until fragrant",
          "Cool completely before serving and storing"
        ],
        culturalNote: "Traditional Mexican street snack made healthier with measured portions and quality ingredients",
        healthBenefits: ["Healthy monounsaturated fats", "Vitamin E and magnesium", "Protein for sustained energy"],
        researchConnection: "Demonstrates how traditional snacks can be adapted to support heart health goals"
      },
      {
        name: "Tropical Chia Pudding",
        description: "Nutritious chia seed pudding with tropical flavors",
        prepTime: "5 min (plus 2 hours chilling)",
        servings: 2,
        fiber: "10g",
        satFat: "1g",
        ingredients: [
          "1/4 cup chia seeds",
          "1 cup unsweetened coconut milk",
          "1 tbsp honey or agave",
          "1/2 tsp vanilla extract",
          "1/4 cup diced mango",
          "1/4 cup diced pineapple",
          "1 tbsp toasted coconut flakes",
          "1 tbsp chopped pistachios"
        ],
        instructions: [
          "Whisk together chia seeds, coconut milk, honey, and vanilla",
          "Let sit for 5 minutes, then whisk again to prevent clumping",
          "Refrigerate for at least 2 hours or overnight",
          "Before serving, stir pudding to break up any lumps",
          "Top with diced mango, pineapple, toasted coconut, and pistachios",
          "Serve chilled in glasses or bowls"
        ],
        culturalNote: "Incorporates tropical fruits beloved in Latino cuisine with superfood chia seeds",
        healthBenefits: ["Extremely high fiber content", "Omega-3 fatty acids from chia", "Natural sweetness from tropical fruits"],
        researchConnection: "Exceeds daily fiber targets in a single serving while providing satisfying tropical flavors"
      }
    ]
  };

  const weeklyMealPlans = {
    1: {
      theme: "Foundation Week - Building Healthy Habits",
      focus: "Introducing Mediterranean ingredients with familiar Latino flavors and family involvement",
      monday: {
        breakfast: "Cinnamon Walnut Oatmeal",
        lunch: "Black Bean Quinoa Salad",
        dinner: "Baked Fish with Roasted Vegetables",
        snack: "Spiced Vegetable Hummus"
      },
      tuesday: {
        breakfast: "Mediterranean Huevos Rancheros",
        lunch: "Mediterranean Chicken Soup",
        dinner: "Mediterranean-Style Mole Chicken",
        snack: "Chili-Lime Roasted Almonds"
      },
      wednesday: {
        breakfast: "Greek yogurt with berries and honey",
        lunch: "Lentil and Vegetable Power Bowl",
        dinner: "Stuffed Bell Peppers with Quinoa",
        snack: "Apple slices with almond butter"
      },
      thursday: {
        breakfast: "Tropical Quinoa Breakfast Bowl",
        lunch: "Mediterranean chicken salad wrap",
        dinner: "Bean and vegetable enchiladas (baked, not fried)",
        snack: "Tropical Chia Pudding"
      },
      friday: {
        breakfast: "Green smoothie with spinach, banana, and chia seeds",
        lunch: "Quinoa-stuffed bell peppers (leftover)",
        dinner: "Grilled fish with Mediterranean vegetables",
        snack: "Cucumber slices with hummus"
      },
      saturday: {
        breakfast: "Weekend family breakfast - vegetable omelet",
        lunch: "Large mixed salad with white beans and olive oil dressing",
        dinner: "Family cooking session - modified traditional family recipe",
        snack: "Fresh fruit salad with mint"
      },
      sunday: {
        breakfast: "Whole grain pancakes with fresh berries",
        lunch: "Meal prep session for upcoming week",
        dinner: "Celebration dinner - favorite adapted family recipe",
        snack: "Dark chocolate (1 oz) with nuts"
      },
      weeklyGoals: [
        "Track daily fiber intake (goal: 21g+)",
        "Limit saturated fat to under 10g daily",
        "Include olive oil in 2-3 meals daily",
        "Add one new Mediterranean ingredient"
      ]
    },
    2: {
      theme: "Expansion Week - Deepening Mediterranean Integration",
      focus: "Adding more fish, increasing vegetable variety, and building cooking confidence",
      monday: {
        breakfast: "Mediterranean-style scrambled eggs with vegetables",
        lunch: "Lentil soup with whole grain bread",
        dinner: "Grilled salmon with quinoa and roasted vegetables",
        snack: "Mixed nuts and dried fruit (portion-controlled)"
      },
      tuesday: {
        breakfast: "Overnight oats with chia seeds and fruit",
        lunch: "Chickpea and vegetable curry",
        dinner: "Turkey meatballs in tomato sauce with zucchini noodles",
        snack: "Homemade trail mix"
      },
      wednesday: {
        breakfast: "Avocado toast on whole grain bread",
        lunch: "Mediterranean tuna salad with white beans",
        dinner: "Vegetarian paella with brown rice",
        snack: "Roasted chickpeas with spices"
      },
      thursday: {
        breakfast: "Quinoa breakfast porridge with nuts",
        lunch: "Gazpacho with whole grain crackers",
        dinner: "Baked chicken thighs with Mediterranean herbs",
        snack: "Greek yogurt with honey and walnuts"
      },
      friday: {
        breakfast: "Breakfast burrito with black beans and avocado",
        lunch: "Farro salad with roasted vegetables",
        dinner: "Fish tacos with cabbage slaw",
        snack: "Celery sticks with almond butter"
      },
      saturday: {
        breakfast: "Weekend family cooking - healthy breakfast hash",
        lunch: "Family recipe modification workshop",
        dinner: "Grilled vegetable and quinoa bowl",
        snack: "Fruit and nut energy balls"
      },
      sunday: {
        breakfast: "Chia seed pudding with tropical fruits",
        lunch: "Preparation for week 3 meal plan",
        dinner: "Mediterranean-style bean and vegetable stew",
        snack: "Dark chocolate-covered almonds"
      },
      weeklyGoals: [
        "Include fish 3 times this week",
        "Try 2 new Mediterranean vegetables",
        "Involve family in 3 cooking sessions",
        "Reduce portion sizes gradually"
      ]
    },
    3: {
      theme: "Mastery Week - Independence and Long-term Success",
      focus: "Confident meal preparation, family integration, and planning for sustainability",
      monday: {
        breakfast: "Personal favorite adapted breakfast recipe",
        lunch: "Self-prepared Mediterranean-Latino fusion dish",
        dinner: "Independently modified family recipe",
        snack: "Chosen healthy snack from repertoire"
      },
      tuesday: {
        breakfast: "Confident preparation of learned recipe",
        lunch: "Creative combination of Mediterranean ingredients",
        dinner: "Family dinner featuring adapted traditional dish",
        snack: "Homemade healthy snack"
      },
      wednesday: {
        breakfast: "Quick and healthy breakfast solution",
        lunch: "Meal prep creation for busy days",
        dinner: "Restaurant-style Mediterranean dish at home",
        snack: "Nutrient-dense energy snack"
      },
      thursday: {
        breakfast: "Seasonal fruit and grain bowl",
        lunch: "Social lunch featuring healthy choices",
        dinner: "Fish dish with confident seasoning",
        snack: "Mindful snacking practice"
      },
      friday: {
        breakfast: "Weekend prep breakfast",
        lunch: "Celebration of learning - favorite new dish",
        dinner: "Family gathering with healthy adaptations",
        snack: "Special occasion healthy treat"
      },
      saturday: {
        breakfast: "Family breakfast featuring everyone's input",
        lunch: "Potluck-style meal with healthy dishes",
        dinner: "Celebration dinner showcasing transformation",
        snack: "Sharing healthy recipes with friends"
      },
      sunday: {
        breakfast: "Reflection and planning breakfast",
        lunch: "Meal planning for long-term success",
        dinner: "Commitment ceremony - family pledge to health",
        snack: "Mindful eating practice"
      },
      weeklyGoals: [
        "Achieve target metrics independently",
        "Plan next month's approach",
        "Build sustainable shopping and prep routines",
        "Create family support systems"
      ]
    }
  };

  const shoppingList = {
    proteins: [
      "Skinless chicken breast and thighs",
      "White fish fillets (tilapia, cod, mahi-mahi)",
      "Canned salmon or tuna (in water)",
      "Large eggs",
      "Low-fat Greek yogurt",
      "Canned chickpeas and black beans",
      "Cannellini (white) beans",
      "Green and brown lentils",
      "Quinoa (white and red varieties)"
    ],
    vegetables: [
      "Fresh spinach and mixed greens",
      "Bell peppers (various colors)",
      "Tomatoes (fresh and canned, low sodium)",
      "Yellow and red onions",
      "Fresh garlic",
      "Cucumber",
      "Zucchini and yellow squash",
      "Eggplant",
      "Carrots and celery",
      "Avocados",
      "Jicama (Mexican turnip)"
    ],
    fruits: [
      "Fresh berries (blueberries, strawberries)",
      "Bananas",
      "Mango and pineapple",
      "Limes and lemons",
      "Apples",
      "Seasonal fresh fruits"
    ],
    pantry: [
      "Extra virgin olive oil",
      "Whole grain tortillas and bread",
      "Steel-cut oats and quinoa",
      "Brown rice and farro",
      "Raw nuts (almonds, walnuts, pistachios)",
      "Seeds (chia, sesame, pumpkin)",
      "Ground cinnamon and cumin",
      "Dried oregano and smoked paprika",
      "Chili powder and chipotle powder",
      "Dark chocolate (70% cacao)",
      "Low-sodium chicken and vegetable broth",
      "Tahini (sesame seed paste)",
      "Honey and pure vanilla extract"
    ]
  };

  const nutritionTargets = [
    { 
      nutrient: "Daily Fiber", 
      target: "21-22g", 
      color: "text-green-600",
      studyResult: "Achieved: 21.9g average"
    },
    { 
      nutrient: "Saturated Fat", 
      target: "< 10g daily", 
      color: "text-red-600",
      studyResult: "Achieved: 9.45g average"
    },
    { 
      nutrient: "Olive Oil", 
      target: "2-3 tbsp daily", 
      color: "text-yellow-600",
      studyResult: "Primary cooking fat used"
    },
    { 
      nutrient: "Vegetables", 
      target: "5-7 servings daily", 
      color: "text-green-500",
      studyResult: "Significantly increased intake"
    },
    { 
      nutrient: "Fish", 
      target: "2-3 times weekly", 
      color: "text-blue-600",
      studyResult: "Successfully incorporated"
    },
    { 
      nutrient: "Legumes", 
      target: "4-5 times weekly", 
      color: "text-purple-600",
      studyResult: "Daily consumption achieved"
    }
  ];

  const culturalAdaptationTips = [
    {
      category: "Flavor Preservation",
      tips: [
        "Use cumin, chili powder, and paprika to maintain familiar tastes",
        "Substitute olive oil for lard in traditional recipes",
        "Add lime juice and cilantro for authentic Latino flavors",
        "Use fresh herbs instead of salt for seasoning"
      ]
    },
    {
      category: "Family Integration",
      tips: [
        "Involve children in vegetable preparation",
        "Make healthy versions of family celebration foods",
        "Share the health benefits with extended family",
        "Create new family traditions around healthy cooking"
      ]
    },
    {
      category: "Budget-Friendly Approaches",
      tips: [
        "Buy dried beans and lentils in bulk",
        "Use seasonal vegetables and fruits",
        "Prepare large batches for multiple meals",
        "Shop at Latino markets for affordable produce"
      ]
    }
  ];

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Mediterranean-Latino Recipe Collection
        </h1>
        <p className="text-lg text-gray-600 max-w-4xl mx-auto">
          Evidence-based recipes and meal plans inspired by the ¡Viva Bien! research - 
          combining Mediterranean health benefits with beloved Latino flavors for families managing prediabetes and high cholesterol
        </p>
      </div>

      <Alert className="bg-gradient-to-r from-blue-50 to-green-50 border-none">
        <Heart className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-gray-700">
          <strong>Research-Based Results:</strong> Participants following these principles achieved 
          21.9g daily fiber, reduced saturated fat to 9.45g, and maintained 100% satisfaction while preserving cultural food preferences.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="recipes" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="recipes">Recipes</TabsTrigger>
          <TabsTrigger value="meal-plans">Meal Plans</TabsTrigger>
          <TabsTrigger value="shopping">Shopping Guide</TabsTrigger>
          <TabsTrigger value="nutrition">Nutrition Targets</TabsTrigger>
          <TabsTrigger value="cultural">Cultural Tips</TabsTrigger>
        </TabsList>

        <TabsContent value="recipes" className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {Object.entries(recipeCategories).map(([key, category]) => (
              <button
                key={key}
                onClick={() => setSelectedCategory(key)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedCategory === key 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex flex-col items-center space-y-2">
                  {category.icon}
                  <span className="font-medium text-sm">{category.title}</span>
                </div>
              </button>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {recipes[selectedCategory]?.map((recipe, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl mb-2">{recipe.name}</CardTitle>
                      <CardDescription className="text-gray-600">
                        {recipe.description}
                      </CardDescription>
                    </div>
                    <Badge className={recipeCategories[selectedCategory].color}>
                      {recipeCategories[selectedCategory].title}
                    </Badge>
                  </div>
                  <div className="flex gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {recipe.prepTime}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {recipe.servings} servings
                    </span>
                    <span className="text-green-600 font-medium">
                      Fiber: {recipe.fiber}
                    </span>
                    <span className="text-red-600 font-medium">
                      Sat Fat: {recipe.satFat}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Ingredients:</h4>
                    <ul className="text-sm space-y-1">
                      {recipe.ingredients.map((ingredient, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                          {ingredient}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Instructions:</h4>
                    <ol className="text-sm space-y-2">
                      {recipe.instructions.map((step, i) => (
                        <li key={i} className="flex gap-3">
                          <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-medium">
                            {i + 1}
                          </span>
                          {step}
                        </li>
                      ))}
                    </ol>
                  </div>

                  <div className="bg-yellow-50 p-3 rounded-lg">
                    <h4 className="font-semibold text-yellow-800 mb-1 flex items-center gap-1">
                      <Globe className="h-4 w-4" />
                      Cultural Connection:
                    </h4>
                    <p className="text-sm text-yellow-700">{recipe.culturalNote}</p>
                  </div>

                  <div className="bg-green-50 p-3 rounded-lg">
                    <h4 className="font-semibold text-green-800 mb-1">Health Benefits:</h4>
                    <ul className="text-sm text-green-700 space-y-1">
                      {recipe.healthBenefits.map((benefit, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <Heart className="h-3 w-3 text-green-600" />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {recipe.researchConnection && (
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <h4 className="font-semibold text-blue-800 mb-1">Research Connection:</h4>
                      <p className="text-sm text-blue-700">{recipe.researchConnection}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="meal-plans" className="space-y-6">
          <div className="flex justify-center mb-6">
            <div className="flex rounded-lg border border-gray-200 bg-gray-50 p-1">
              {[1, 2, 3].map((week) => (
                <button
                  key={week}
                  onClick={() => setSelectedWeek(week)}
                  className={`px-4 py-2 rounded-md font-medium transition-all ${
                    selectedWeek === week
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Week {week}
                </button>
              ))}
            </div>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                {weeklyMealPlans[selectedWeek]?.theme}
              </CardTitle>
              <CardDescription>
                {weeklyMealPlans[selectedWeek]?.focus}
              </CardDescription>
            </CardHeader>
          </Card>

          <div className="grid gap-4">
            {Object.entries(weeklyMealPlans[selectedWeek] || {}).map(([day, meals]) => {
              if (day === 'theme' || day === 'focus' || day === 'weeklyGoals') return null;
              
              return (
                <Card key={day} className="overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 pb-3">
                    <CardTitle className="text-lg capitalize">
                      {day === 'monday' ? 'Monday' :
                       day === 'tuesday' ? 'Tuesday' :
                       day === 'wednesday' ? 'Wednesday' :
                       day === 'thursday' ? 'Thursday' :
                       day === 'friday' ? 'Friday' :
                       day === 'saturday' ? 'Saturday' :
                       day === 'sunday' ? 'Sunday' : day}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="grid md:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <h4 className="font-semibold text-yellow-700 flex items-center gap-1">
                          <ChefHat className="h-4 w-4" />
                          Breakfast
                        </h4>
                        <p className="text-sm bg-yellow-50 p-2 rounded">{meals.breakfast}</p>
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-semibold text-green-700 flex items-center gap-1">
                          <Heart className="h-4 w-4" />
                          Lunch
                        </h4>
                        <p className="text-sm bg-green-50 p-2 rounded">{meals.lunch}</p>
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-semibold text-blue-700 flex items-center gap-1">
                          <Star className="h-4 w-4" />
                          Dinner
                        </h4>
                        <p className="text-sm bg-blue-50 p-2 rounded">{meals.dinner}</p>
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-semibold text-purple-700 flex items-center gap-1">
                          <Leaf className="h-4 w-4" />
                          Snack
                        </h4>
                        <p className="text-sm bg-purple-50 p-2 rounded">{meals.snack}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {weeklyMealPlans[selectedWeek]?.weeklyGoals && (
            <Card className="bg-gradient-to-r from-green-50 to-blue-50">
              <CardHeader>
                <CardTitle className="text-green-700">Week {selectedWeek} Goals</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {weeklyMealPlans[selectedWeek].weeklyGoals.map((goal, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">{goal}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="shopping" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-green-600" />
                Mediterranean-Latino Shopping Guide
              </CardTitle>
              <CardDescription>
                Essential ingredients for your Mediterranean-Latino kitchen transformation based on research-proven recipes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <h3 className="font-semibold text-lg mb-4 text-blue-700 border-b pb-2">Proteins & Legumes</h3>
                  <ul className="space-y-2">
                    {shoppingList.proteins.map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <input type="checkbox" className="rounded" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-4 text-green-700 border-b pb-2">Vegetables</h3>
                  <ul className="space-y-2">
                    {shoppingList.vegetables.map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <input type="checkbox" className="rounded" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-4 text-orange-700 border-b pb-2">Fruits</h3>
                  <ul className="space-y-2">
                    {shoppingList.fruits.map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <input type="checkbox" className="rounded" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-4 text-purple-700 border-b pb-2">Pantry Essentials</h3>
                  <ul className="space-y-2">
                    {shoppingList.pantry.map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <input type="checkbox" className="rounded" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Alert className="bg-blue-50 border-blue-200">
            <ShoppingCart className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>Shopping Strategy:</strong> Start with just 3-4 new ingredients each week. 
              The research showed gradual adaptation was more sustainable than dramatic changes. Focus on replacing cooking fats first, then adding new vegetables.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle>Budget-Friendly Shopping Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-purple-600 mb-3">Cost-Saving Strategies</h3>
                  <ul className="space-y-2 text-sm">
                    <li>• Buy dried beans and lentils in bulk (much cheaper than canned)</li>
                    <li>• Purchase olive oil in larger containers for better value</li>
                    <li>• Shop at Latino markets for affordable fresh produce</li>
                    <li>• Choose seasonal fruits and vegetables</li>
                    <li>• Buy nuts and seeds from bulk bins</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-purple-600 mb-3">Meal Prep Economics</h3>
                  <ul className="space-y-2 text-sm">
                    <li>• Cook large batches of quinoa and brown rice</li>
                    <li>• Prepare big pots of bean-based soups</li>
                    <li>• Wash and prep vegetables when you get home from shopping</li>
                    <li>• Make homemade hummus instead of buying pre-made</li>
                    <li>• Freeze portions of cooked grains and legumes</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="nutrition" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Daily Nutrition Targets Based on Research Results</CardTitle>
              <CardDescription>
                These targets are based on the successful outcomes from the ¡Viva Bien! study participants
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                {nutritionTargets.map((target, index) => (
                  <div key={index} className="p-4 border rounded-lg bg-gray-50">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-semibold">{target.nutrient}</h3>
                      <span className={`font-bold ${target.color}`}>{target.target}</span>
                    </div>
                    <p className="text-xs text-green-600 font-medium">{target.studyResult}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Weekly Progress Tracking Chart</CardTitle>
              <CardDescription>
                Monitor your adoption of Mediterranean-Latino eating patterns like study participants
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid md:grid-cols-8 gap-2 text-center text-sm">
                  <div className="font-semibold">Target</div>
                  <div className="font-semibold">Mon</div>
                  <div className="font-semibold">Tue</div>
                  <div className="font-semibold">Wed</div>
                  <div className="font-semibold">Thu</div>
                  <div className="font-semibold">Fri</div>
                  <div className="font-semibold">Sat</div>
                  <div className="font-semibold">Sun</div>
                </div>
                
                {[
                  'Olive Oil (2-3 tbsp)', 
                  'Fish/Seafood', 
                  'Legumes/Beans', 
                  'Vegetables (5+ servings)', 
                  'Nuts/Seeds', 
                  'Whole Grains',
                  'Fiber Goal (21g+)',
                  'Sat Fat <10g'
                ].map((item, i) => (
                  <div key={i} className="grid md:grid-cols-8 gap-2 items-center">
                    <div className="text-sm font-medium">{item}</div>
                    {[1,2,3,4,5,6,7].map(day => (
                      <div key={day} className="flex justify-center">
                        <input type="checkbox" className="rounded" />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Alert className="bg-green-50 border-green-200">
            <Heart className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>Research Success:</strong> Study participants achieved 100% satisfaction 
              with these dietary changes while maintaining their cultural food preferences and seeing significant health improvements.
            </AlertDescription>
          </Alert>
        </TabsContent>

        <TabsContent value="cultural" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-purple-600" />
                Cultural Adaptation Strategies
              </CardTitle>
              <CardDescription>
                Research-based approaches for maintaining Latino food culture while improving health outcomes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {culturalAdaptationTips.map((category, index) => (
                  <div key={index} className="border-l-4 border-purple-500 pl-4">
                    <h3 className="font-semibold text-lg mb-3 text-purple-700">{category.category}</h3>
                    <div className="grid md:grid-cols-2 gap-3">
                      {category.tips.map((tip, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          {tip}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Family Involvement Success Stories from the Research</CardTitle>
              <CardDescription>
                How participants successfully integrated their families into the Mediterranean-Latino lifestyle
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-blue-600">What Worked in the Study</h3>
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-start gap-2">
                      <Star className="h-4 w-4 text-yellow-500 mt-0.5" />
                      <span><strong>Family Night Sessions:</strong> Participants requested and highly valued family education sessions</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Star className="h-4 w-4 text-yellow-500 mt-0.5" />
                      <span><strong>Cooking Demonstrations:</strong> Hands-on cooking was among the most valued program components</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Star className="h-4 w-4 text-yellow-500 mt-0.5" />
                      <span><strong>Cultural Food Respect:</strong> Maintaining familiar flavors while improving nutrition was key to success</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Star className="h-4 w-4 text-yellow-500 mt-0.5" />
                      <span><strong>Social Support:</strong> Family and friend support significantly improved adherence</span>
                    </li>
                  </ul>
                </div>
                <div className="space-y-4">
                  <h3 className="font-semibold text-blue-600">How to Apply These Lessons</h3>
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                      <span>Schedule weekly family cooking sessions focusing on one new healthy recipe</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                      <span>Invite extended family to learn about the health benefits of Mediterranean foods</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                      <span>Create family challenges around trying new vegetables or healthy cooking methods</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                      <span>Share success stories and health improvements with your social network</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Alert className="bg-purple-50 border-purple-200">
            <Globe className="h-4 w-4 text-purple-600" />
            <AlertDescription className="text-purple-800">
              <strong>Cultural Insight:</strong> The research found that familismo (family connectedness) was crucial for success. 
              Participants who involved their families had better long-term adherence and greater satisfaction with the program.
            </AlertDescription>
          </Alert>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MediterraneanLatinoRecipesEnglish;
