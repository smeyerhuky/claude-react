import React, { useState } from 'react';
import { Info, ChefHat, Clock, Users, Check, ChevronRight, ChevronLeft } from 'lucide-react';

const TabbedMuffinRecipes = () => {
  // State for managing active tab
  const [activeTab, setActiveTab] = useState('original');
  // State for tracking checked ingredients
  const [checkedItems, setCheckedItems] = useState({});
  // State for current step in instructions
  const [currentStep, setCurrentStep] = useState(0);

  // Recipe data
  const recipes = {
    original: {
      title: "Gluten-Free Carrot Muffins",
      subtitle: "Dairy-Free & Nut-Free",
      description: "Deliciously moist carrot muffins that everyone can enjoy - perfect for those with dietary restrictions!",
      stats: {
        yield: "12 muffins",
        time: "25 minutes",
        difficulty: "Easy"
      },
      ingredients: {
        "Dry Ingredients": [
          "1½ cups gluten-free 1:1 baking flour",
          "½ cup oat flour",
          "1 teaspoon baking powder",
          "1 teaspoon baking soda",
          "½ teaspoon salt",
          "1½ teaspoons ground cinnamon",
          "¼ teaspoon ground nutmeg (optional)",
          "¼ teaspoon ground ginger (optional)"
        ],
        "Wet Ingredients": [
          "¾ cup coconut oil, melted",
          "¾ cup brown sugar, packed",
          "¼ cup granulated sugar",
          "3 large eggs, room temperature",
          "2 teaspoons vanilla extract",
          "¼ cup dairy-free milk"
        ],
        "Add-ins": [
          "2 cups finely grated carrots",
          "½ cup raisins (optional)",
          "½ cup unsweetened shredded coconut (optional)"
        ]
      },
      instructions: [
        {
          title: "Prepare for Baking",
          content: "Preheat oven to 350°F (175°C). Line a 12-cup muffin tin with paper liners. Grate carrots finely."
        },
        {
          title: "Mix Dry Ingredients",
          content: "In a large bowl, whisk together all dry ingredients until well combined."
        },
        {
          title: "Combine Wet Ingredients",
          content: "In a separate bowl, whisk melted coconut oil with sugars. Add eggs one at a time, then vanilla and milk."
        },
        {
          title: "Combine Wet and Dry",
          content: "Pour wet ingredients into dry. Fold gently until just combined. Don't overmix."
        },
        {
          title: "Add Carrots",
          content: "Fold in grated carrots and any optional add-ins until evenly distributed."
        },
        {
          title: "Fill and Bake",
          content: "Fill muffin cups ¾ full. Bake for 20-25 minutes until a toothpick comes out clean."
        },
        {
          title: "Cool and Serve",
          content: "Cool in pan for 5 minutes, then transfer to a wire rack. Store in an airtight container."
        }
      ]
    },
    skyr: {
      title: "High-Protein Carrot Skyr Muffins",
      subtitle: "With Protein-Rich Yogurt",
      description: "Enhanced version featuring skyr for extra protein and incredible moisture. Perfect for a nutritious breakfast or post-workout snack!",
      stats: {
        yield: "12 muffins",
        time: "27 minutes",
        difficulty: "Easy"
      },
      ingredients: {
        "Dry Ingredients": [
          "1½ cups gluten-free 1:1 baking flour",
          "½ cup oat flour",
          "1 teaspoon baking powder",
          "1 teaspoon baking soda",
          "½ teaspoon salt",
          "1½ teaspoons ground cinnamon",
          "¼ teaspoon ground nutmeg (optional)",
          "¼ teaspoon ground ginger (optional)"
        ],
        "Wet Ingredients": [
          "½ cup coconut oil, melted",
          "½ cup plain skyr (high-protein yogurt)",
          "¾ cup brown sugar, packed",
          "¼ cup granulated sugar",
          "3 large eggs, room temperature",
          "2 teaspoons vanilla extract",
          "2 tablespoons dairy-free milk"
        ],
        "Add-ins": [
          "2 cups finely grated carrots",
          "½ cup raisins (optional)",
          "½ cup unsweetened shredded coconut (optional)",
          "1 tablespoon orange zest (optional)"
        ]
      },
      instructions: [
        {
          title: "Prepare Ingredients",
          content: "Preheat oven to 350°F (175°C). Line muffin tin. Bring skyr and eggs to room temperature. Grate carrots."
        },
        {
          title: "Mix Dry Ingredients",
          content: "Whisk together all dry ingredients, breaking up any lumps in the flours."
        },
        {
          title: "Prepare Wet Ingredients",
          content: "Whisk melted coconut oil with sugars. Add skyr and whisk until smooth. Beat in eggs one at a time, then vanilla and milk."
        },
        {
          title: "Combine Mixtures",
          content: "Create a well in dry ingredients. Pour in wet mixture and fold gently until just combined. Batter will be thicker than original."
        },
        {
          title: "Add Mix-ins",
          content: "Fold in carrots first, then any optional ingredients. Orange zest adds brightness that complements skyr."
        },
        {
          title: "Fill and Bake",
          content: "Fill muffin cups ¾ full. Bake 22-27 minutes until toothpick comes out with few moist crumbs."
        },
        {
          title: "Cool Properly",
          content: "Cool in pan 5 minutes, then transfer to wire rack. These are more delicate when warm but firm up nicely."
        }
      ]
    }
  };

  const activeRecipe = recipes[activeTab];

  const toggleIngredient = (ingredient) => {
    setCheckedItems(prev => ({
      ...prev,
      [ingredient]: !prev[ingredient]
    }));
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header with Tabs */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-4 justify-center mb-6">
          <button
            onClick={() => setActiveTab('original')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'original'
                ? 'bg-orange-500 text-white shadow-lg transform scale-105'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Original Recipe
          </button>
          <button
            onClick={() => setActiveTab('skyr')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'skyr'
                ? 'bg-orange-500 text-white shadow-lg transform scale-105'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Skyr-Enhanced Recipe
          </button>
        </div>

        {/* Recipe Title and Description */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            {activeRecipe.title}
          </h1>
          <h2 className="text-xl text-orange-600 mb-4">
            {activeRecipe.subtitle}
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            {activeRecipe.description}
          </p>
        </div>

        {/* Recipe Stats */}
        <div className="flex justify-center gap-8 mb-8">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-orange-500" />
            <span>{activeRecipe.stats.yield}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-500" />
            <span>{activeRecipe.stats.time}</span>
          </div>
          <div className="flex items-center gap-2">
            <ChefHat className="w-5 h-5 text-orange-500" />
            <span>{activeRecipe.stats.difficulty}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Ingredients Section */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">Ingredients</h3>
          
          {Object.entries(activeRecipe.ingredients).map(([category, items]) => (
            <div key={category} className="mb-6">
              <h4 className="text-lg font-semibold text-orange-600 mb-3">
                {category}
              </h4>
              <ul className="space-y-2">
                {items.map((item, index) => (
                  <li key={index} className="flex items-center">
                    <button
                      onClick={() => toggleIngredient(`${category}-${index}`)}
                      className={`w-5 h-5 rounded border-2 mr-3 flex items-center justify-center transition-all ${
                        checkedItems[`${category}-${index}`]
                          ? 'bg-orange-500 border-orange-500'
                          : 'border-gray-300'
                      }`}
                    >
                      {checkedItems[`${category}-${index}`] && (
                        <Check className="w-3 h-3 text-white" />
                      )}
                    </button>
                    <span className={checkedItems[`${category}-${index}`] ? 'line-through text-gray-400' : ''}>
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Instructions Section */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">Instructions</h3>
          
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xl font-semibold text-orange-600">
                Step {currentStep + 1}: {activeRecipe.instructions[currentStep].title}
              </h4>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
                  disabled={currentStep === 0}
                  className={`p-2 rounded-lg ${
                    currentStep === 0
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-orange-500 hover:bg-orange-50'
                  }`}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setCurrentStep(prev => Math.min(activeRecipe.instructions.length - 1, prev + 1))}
                  disabled={currentStep === activeRecipe.instructions.length - 1}
                  className={`p-2 rounded-lg ${
                    currentStep === activeRecipe.instructions.length - 1
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-orange-500 hover:bg-orange-50'
                  }`}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <p className="text-gray-700 mb-6">
              {activeRecipe.instructions[currentStep].content}
            </p>

            {/* Progress Indicator */}
            <div className="flex justify-center gap-2">
              {activeRecipe.instructions.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentStep(index)}
                  className={`w-3 h-3 rounded-full transition-all ${
                    index === currentStep
                      ? 'bg-orange-500 w-8'
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Tips Section */}
          <div className="bg-orange-50 rounded-lg p-4 mt-8">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-orange-500 mt-1" />
              <div>
                <h5 className="font-semibold text-orange-700 mb-2">
                  Baking Tips
                </h5>
                <ul className="text-sm text-orange-900 space-y-1">
                  {activeTab === 'original' ? (
                    <>
                      <li>• Grate carrots finely for even distribution</li>
                      <li>• Don't overmix - gluten-free batters can become gummy</li>
                      <li>• Check that oat flour is from a nut-free facility</li>
                    </>
                  ) : (
                    <>
                      <li>• Bring skyr to room temperature to prevent oil clumping</li>
                      <li>• These muffins improve in flavor after the first day</li>
                      <li>• Orange zest complements the skyr's tanginess beautifully</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Comparison Banner */}
      <div className="mt-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white">
        <div className="max-w-3xl mx-auto text-center">
          <h3 className="text-2xl font-bold mb-4">Why Choose This Recipe?</h3>
          {activeTab === 'original' ? (
            <p>
              Our original recipe is perfect for those who need strict dairy-free compliance. 
              It's lighter, uses readily available ingredients, and has been tested for reliable results. 
              The coconut oil keeps these muffins moist for days!
            </p>
          ) : (
            <p>
              The skyr version adds a protein boost with 6-8g more protein per muffin. 
              The yogurt creates an incredibly tender crumb and adds beneficial probiotics. 
              Perfect for athletes or anyone wanting a more nutritious breakfast option!
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TabbedMuffinRecipes;
