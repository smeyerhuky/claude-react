import { useState } from 'react';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '../ui/tabs';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '../ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../ui/select';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Lightbulb, Flame, Clock, ChefHat, Sparkles } from 'lucide-react';

const MediterraneanMealPlanOriginal = () => {
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
      image: "egg-cups",
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
      image: "yogurt-bowl",
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
      image: "avocado-toast",
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
      image: "shakshuka",
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
      image: "savory-oatmeal",
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
      image: "frittata",
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
      image: "breakfast-salad",
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
      image: "bean-toast",
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
      image: "greek-salad",
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
      image: "tuna-wrap",
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
      image: "lentil-soup",
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
      image: "quinoa-bowl",
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
      image: "yogurt-snack",
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
      image: "hummus-veg",
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
      image: "trail-mix",
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
      image: "caprese-skewer",
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
      image: "fish-veg",
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
      image: "souvlaki",
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
      image: "lentil-stew",
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
      image: "eggplant-chickpea",
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
      image: "stuffed-pepper",
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
      image: "buddha-bowl",
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
      image: "zoodles-shrimp",
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
      image: "veg-paella",
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
    <div className="w-full space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Mediterranean 1200-Calorie Meal Planner</h1>
          <p className="text-muted-foreground">Delicious, flexible meals for your calorie deficit journey</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm py-1">
            Daily Total: {calculateDailyCalories()} calories
          </Badge>
          <Badge variant={calculateDailyCalories() <= 1200 ? "success" : "destructive"} className="text-sm py-1">
            {calculateDailyCalories() <= 1200 ? "On Target" : "Over Budget"}
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="breakfast">
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="breakfast">Breakfast</TabsTrigger>
          <TabsTrigger value="lunch">Lunch</TabsTrigger>
          <TabsTrigger value="snacks">Snacks</TabsTrigger>
          <TabsTrigger value="dinner">Dinner</TabsTrigger>
        </TabsList>
        
        <TabsContent value="breakfast" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Savory Mediterranean Breakfasts</h2>
            <Select value={breakfastIndex.toString()} onValueChange={(value) => setBreakfastIndex(parseInt(value))}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Select a breakfast" />
              </SelectTrigger>
              <SelectContent>
                {breakfasts.map((breakfast, index) => (
                  <SelectItem key={index} value={index.toString()}>
                    {breakfast.name} ({breakfast.calories} cal)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>{breakfasts[breakfastIndex].name}</CardTitle>
                <Badge>{breakfasts[breakfastIndex].calories} calories</Badge>
              </div>
              <CardDescription>Mediterranean-inspired savory breakfast (~300 calories)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium mb-1">Ingredients</h4>
                    <ul className="text-sm space-y-1">
                      {breakfasts[breakfastIndex].ingredients.map((ingredient, i) => (
                        <li key={i}>• {ingredient}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Instructions</h4>
                    <p className="text-sm">{breakfasts[breakfastIndex].instructions}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-2 bg-amber-50 p-3 rounded-md border border-amber-200">
                    <Lightbulb className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-amber-800 text-sm">Adaptation Tip</h4>
                      <p className="text-sm text-amber-900">{breakfasts[breakfastIndex].adaptationTip}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 bg-green-50 p-3 rounded-md border border-green-200">
                    <Sparkles className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-green-800 text-sm">Nutrition Insight</h4>
                      <p className="text-sm text-green-900">{breakfasts[breakfastIndex].nutritionTip}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="lunch" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Mediterranean Lunch Options</h2>
            <Badge>300 calories each</Badge>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            {lunches.map((lunch, index) => (
              <Card key={index}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-base">{lunch.name}</CardTitle>
                    <Badge variant="outline">{lunch.calories} cal</Badge>
                  </div>
                </CardHeader>
                <CardContent className="pb-3">
                  <p className="text-sm">{lunch.adaptationTip}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="snacks" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Mediterranean Snacks</h2>
            <Select value={snackIndex.toString()} onValueChange={(value) => setSnackIndex(parseInt(value))}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Select a snack" />
              </SelectTrigger>
              <SelectContent>
                {snacks.map((snack, index) => (
                  <SelectItem key={index} value={index.toString()}>
                    {snack.name} ({snack.calories} cal)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>{snacks[snackIndex].name}</CardTitle>
                <Badge>{snacks[snackIndex].calories} calories</Badge>
              </div>
              <CardDescription>Quick, satisfying Mediterranean snack (~200 calories)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium mb-1">Ingredients</h4>
                    <ul className="text-sm space-y-1">
                      {snacks[snackIndex].ingredients.map((ingredient, i) => (
                        <li key={i}>• {ingredient}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Instructions</h4>
                    <p className="text-sm">{snacks[snackIndex].instructions}</p>
                  </div>
                </div>
                <div>
                  <div className="flex items-start gap-2 bg-amber-50 p-3 rounded-md border border-amber-200">
                    <Lightbulb className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-amber-800 text-sm">Adaptation Tip</h4>
                      <p className="text-sm text-amber-900">{snacks[snackIndex].adaptationTip}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="dinner" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Mediterranean Dinners</h2>
            <Select value={dinnerIndex.toString()} onValueChange={(value) => setDinnerIndex(parseInt(value))}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Select a dinner" />
              </SelectTrigger>
              <SelectContent>
                {dinners.map((dinner, index) => (
                  <SelectItem key={index} value={index.toString()}>
                    {dinner.name} ({dinner.calories} cal)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>{dinners[dinnerIndex].name}</CardTitle>
                <Badge>{dinners[dinnerIndex].calories} calories</Badge>
              </div>
              <CardDescription>Satisfying Mediterranean dinner (~400 calories)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium mb-1">Ingredients</h4>
                    <ul className="text-sm space-y-1">
                      {dinners[dinnerIndex].ingredients.map((ingredient, i) => (
                        <li key={i}>• {ingredient}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Instructions</h4>
                    <p className="text-sm">{dinners[dinnerIndex].instructions}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-2 bg-amber-50 p-3 rounded-md border border-amber-200">
                    <Lightbulb className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-amber-800 text-sm">Adaptation Tip</h4>
                      <p className="text-sm text-amber-900">{dinners[dinnerIndex].adaptationTip}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 bg-green-50 p-3 rounded-md border border-green-200">
                    <Sparkles className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-green-800 text-sm">Nutrition Insight</h4>
                      <p className="text-sm text-green-900">{dinners[dinnerIndex].nutritionTip}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {tips.map((tip, index) => (
          <Card key={index} className="cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => handleShowTip(tip)}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{tip.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Click to view tips</p>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {showTip && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full m-4 p-4">
            <h3 className="font-bold text-lg mb-2">{currentTip.title}</h3>
            <div className="whitespace-pre-line text-sm">
              {currentTip.content}
            </div>
            <div className="mt-4 flex justify-end">
              <Button onClick={() => setShowTip(false)}>Close</Button>
            </div>
          </div>
        </div>
      )}
      
      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="font-semibold mb-2 flex items-center">
          <ChefHat className="inline mr-2 h-5 w-5 text-blue-600" />
          Mediterranean Diet: Flexibility Is Key
        </h3>
        <p className="text-sm text-blue-800">
          This meal plan is designed to be adaptable to your preferences, schedule, and available ingredients. 
          Mix and match components while keeping within your calorie goals. The Mediterranean diet is a lifestyle, 
          not a rigid diet—focus on the principles of plant-forward eating, healthy fats, and mindful portions rather 
          than perfect adherence to specific recipes.
        </p>
      </div>
    </div>
  );
};

export default MediterraneanMealPlanOriginal;
