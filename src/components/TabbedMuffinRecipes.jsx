import React, { useState } from 'react';
import { Info, ChefHat, Clock, Users, Check, ChevronRight, ChevronLeft, Mountain, Droplets, Recycle } from 'lucide-react';

const TabbedMuffinRecipes = () => {
  const [activeTab, setActiveTab] = useState('original');
  const [checkedItems, setCheckedItems] = useState({});
  const [currentStep, setCurrentStep] = useState(0);
  const [altitudeAdjustment, setAltitudeAdjustment] = useState(true);
  const [milkChoice, setMilkChoice] = useState('oat');

  // High altitude adjustments
  const getAltitudeAdjustedTemp = (baseTemp) => altitudeAdjustment ? baseTemp + 25 : baseTemp;
  const getAltitudeAdjustedBakingPowder = (baseAmount) => {
    if (!altitudeAdjustment) return baseAmount;
    // Reduce by 1/8 teaspoon for each teaspoon at high altitude
    const [amount, unit] = baseAmount.split(' ');
    const numericAmount = eval(amount); // Handle fractions like "1/2"
    const reducedAmount = numericAmount * 0.875;
    return `${reducedAmount} ${unit}`;
  };

  const recipes = {
    original: {
      title: "Carrot Pulp Muffins",
      subtitle: "Using Juice Pulp - Dairy-Free & Nut-Free",
      description: "Transform your carrot juice pulp into incredibly moist muffins! This zero-waste recipe is perfect for those with dietary restrictions and works beautifully at high altitudes.",
      stats: {
        yield: "12 muffins",
        time: `${altitudeAdjustment ? '20-23' : '23-28'} minutes`,
        difficulty: "Easy"
      },
      ingredients: {
        "Dry Ingredients": [
          "1½ cups gluten-free 1:1 baking flour",
          "½ cup oat flour",
          `${getAltitudeAdjustedBakingPowder('1 teaspoon')} baking powder`,
          "1 teaspoon baking soda",
          "½ teaspoon salt",
          "1½ teaspoons ground cinnamon",
          "¼ teaspoon ground nutmeg (optional)",
          "¼ teaspoon ground ginger (optional)",
          altitudeAdjustment && "2 tablespoons additional gluten-free flour (for high altitude)"
        ].filter(Boolean),
        "Wet Ingredients": [
          "¾ cup coconut oil, melted",
          "¾ cup brown sugar, packed",
          "¼ cup granulated sugar",
          `${altitudeAdjustment ? '4' : '3'} large eggs, room temperature`,
          "2 teaspoons vanilla extract",
          `⅓ cup ${milkChoice} milk (increased for pulp)`,
          altitudeAdjustment && "2 tablespoons additional milk (for high altitude)"
        ].filter(Boolean),
        "Add-ins": [
          "1¾ cups carrot pulp (from juicing, lightly packed)",
          "½ cup raisins (optional)",
          "½ cup unsweetened shredded coconut (optional)",
          "1 tablespoon fresh carrot juice (optional, for extra moisture)"
        ]
      },
      instructions: [
        {
          title: "Prepare for Baking",
          content: `Preheat oven to ${getAltitudeAdjustedTemp(350)}°F. Line a 12-cup muffin tin with paper liners. Fluff the carrot pulp with a fork to separate any clumps. Measure 1¾ cups lightly packed pulp.`
        },
        {
          title: "Mix Dry Ingredients",
          content: `In a large bowl, whisk together all dry ingredients until well combined. ${altitudeAdjustment ? 'The extra flour helps provide structure at high altitude.' : ''}`
        },
        {
          title: "Combine Wet Ingredients",
          content: `In a separate bowl, whisk melted coconut oil with sugars. Add eggs one at a time (${altitudeAdjustment ? 'using 4 eggs for high altitude' : 'using 3 eggs'}), then vanilla and ${milkChoice} milk. The extra liquid compensates for the drier carrot pulp.`
        },
        {
          title: "Combine Wet and Dry",
          content: "Pour wet ingredients into dry. Fold gently until just combined. The batter will be thicker than traditional muffin batter."
        },
        {
          title: "Add Carrot Pulp",
          content: "Fold in the carrot pulp and any optional add-ins. If the batter seems too thick, add the optional tablespoon of fresh carrot juice."
        },
        {
          title: "Fill and Bake",
          content: `Fill muffin cups ¾ full. Bake for ${altitudeAdjustment ? '20-23' : '23-28'} minutes. High altitude muffins bake faster. They're done when a toothpick comes out with just a few moist crumbs.`
        },
        {
          title: "Cool and Serve",
          content: "Cool in pan for 5 minutes, then transfer to a wire rack. These muffins are especially moist from the carrot pulp and perfect for breakfast or snacks."
        }
      ]
    },
    skyr: {
      title: "High-Protein Carrot Pulp Muffins",
      subtitle: "With Skyr & Juice Pulp",
      description: "Elevate your carrot pulp muffins with protein-rich skyr! This recipe creates incredibly moist, nutritious muffins that work perfectly at high altitudes and use every bit of your juiced carrots.",
      stats: {
        yield: "12 muffins",
        time: `${altitudeAdjustment ? '22-25' : '25-30'} minutes`,
        difficulty: "Easy"
      },
      ingredients: {
        "Dry Ingredients": [
          "1½ cups gluten-free 1:1 baking flour",
          "½ cup oat flour",
          `${getAltitudeAdjustedBakingPowder('1 teaspoon')} baking powder`,
          "1 teaspoon baking soda",
          "½ teaspoon salt",
          "1½ teaspoons ground cinnamon",
          "¼ teaspoon ground nutmeg (optional)",
          "¼ teaspoon ground ginger (optional)",
          altitudeAdjustment && "2 tablespoons additional gluten-free flour (for high altitude)"
        ].filter(Boolean),
        "Wet Ingredients": [
          "½ cup coconut oil, melted",
          "½ cup plain skyr (high-protein yogurt)",
          "¾ cup brown sugar, packed",
          "¼ cup granulated sugar",
          `${altitudeAdjustment ? '4' : '3'} large eggs, room temperature`,
          "2 teaspoons vanilla extract",
          `3 tablespoons ${milkChoice} milk`,
          altitudeAdjustment && "2 tablespoons additional milk (for high altitude)",
          "1 tablespoon fresh carrot juice (optional)"
        ].filter(Boolean),
        "Add-ins": [
          "1¾ cups carrot pulp (from juicing, lightly packed)",
          "½ cup raisins (optional)",
          "½ cup unsweetened shredded coconut (optional)",
          "1 tablespoon orange zest (optional - pairs well with skyr)"
        ]
      },
      instructions: [
        {
          title: "Prepare Ingredients",
          content: `Preheat oven to ${getAltitudeAdjustedTemp(350)}°F. Line muffin tin. Bring skyr and eggs to room temperature. Fluff carrot pulp with a fork before measuring.`
        },
        {
          title: "Mix Dry Ingredients",
          content: `Whisk together all dry ingredients. ${altitudeAdjustment ? 'The additional flour helps at high altitude where structure is crucial.' : ''}`
        },
        {
          title: "Prepare Wet Ingredients",
          content: `Whisk melted coconut oil with sugars. Add skyr and whisk until smooth. Beat in eggs one at a time (${altitudeAdjustment ? '4 for high altitude' : '3 eggs'}), then vanilla and ${milkChoice} milk.`
        },
        {
          title: "Combine Mixtures",
          content: "Create a well in dry ingredients. Pour in wet mixture and fold gently until just combined. The skyr makes the batter quite thick."
        },
        {
          title: "Add Carrot Pulp",
          content: "Fold in carrot pulp and any optional ingredients. If using fresh carrot juice, add it now for extra moisture."
        },
        {
          title: "Fill and Bake",
          content: `Fill muffin cups ¾ full. Bake ${altitudeAdjustment ? '22-25' : '25-30'} minutes until a toothpick comes out with few moist crumbs.`
        },
        {
          title: "Cool Properly",
          content: "Cool in pan 5 minutes, then transfer to wire rack. The skyr makes these extra moist and they'll firm up as they cool."
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
      {/* Settings Bar */}
      <div className="bg-blue-50 rounded-lg p-4 mb-6 flex flex-wrap gap-4 items-center justify-center">
        <div className="flex items-center gap-2">
          <Mountain className="w-5 h-5 text-blue-600" />
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={altitudeAdjustment}
              onChange={(e) => setAltitudeAdjustment(e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-sm font-medium">High Altitude Adjustments</span>
          </label>
        </div>
        
        <div className="flex items-center gap-2">
          <Droplets className="w-5 h-5 text-blue-600" />
          <select
            value={milkChoice}
            onChange={(e) => setMilkChoice(e.target.value)}
            className="text-sm border rounded px-2 py-1"
          >
            <option value="oat">Oat Milk</option>
            <option value="flax">Flax Milk</option>
            <option value="any plant-based">Any Plant-Based Milk</option>
          </select>
        </div>
      </div>

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
            Original Carrot Pulp Recipe
          </button>
          <button
            onClick={() => setActiveTab('skyr')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'skyr'
                ? 'bg-orange-500 text-white shadow-lg transform scale-105'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Skyr-Enhanced Pulp Recipe
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
          <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            Ingredients 
            <Recycle className="w-6 h-6 text-green-600" />
          </h3>
          
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
                  Special Tips for Carrot Pulp & High Altitude
                </h5>
                <ul className="text-sm text-orange-900 space-y-1">
                  <li>• Carrot pulp is drier than fresh carrots, so extra liquid is crucial</li>
                  <li>• Fluff the pulp before measuring to avoid dense muffins</li>
                  <li>• {milkChoice === 'flax' ? 'Flax milk is thinner, so you might need slightly less' : 'Oat milk adds natural sweetness that complements carrots'}</li>
                  {altitudeAdjustment && (
                    <>
                      <li>• At high altitude, liquids evaporate faster, requiring more moisture</li>
                      <li>• The higher temperature helps set the structure before over-rising</li>
                      <li>• Extra egg provides stability in thin mountain air</li>
                    </>
                  )}
                  <li>• Save some fresh carrot juice to add if batter seems too thick</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Educational Section */}
      <div className="mt-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
        <div className="max-w-3xl mx-auto">
          <h3 className="text-2xl font-bold mb-4 text-center">Why Carrot Pulp Makes Better Muffins</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">Nutritional Benefits:</h4>
              <ul className="text-sm space-y-1">
                <li>• Concentrated fiber content</li>
                <li>• Higher vitamin density</li>
                <li>• Natural sweetness without excess moisture</li>
                <li>• Zero waste from juicing</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Baking Advantages:</h4>
              <ul className="text-sm space-y-1">
                <li>• More consistent texture than grated carrots</li>
                <li>• No excess water to throw off ratios</li>
                <li>• Intensified carrot flavor</li>
                <li>• Finer consistency distributes evenly</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* High Altitude Information */}
      {altitudeAdjustment && (
        <div className="mt-8 bg-blue-50 rounded-xl p-6">
          <div className="max-w-3xl mx-auto">
            <h3 className="text-xl font-bold mb-4 text-blue-800 flex items-center gap-2">
              <Mountain className="w-6 h-6" />
              High Altitude Baking Science
            </h3>
            <p className="text-blue-900 mb-4">
              At elevations above 3,000 feet, the lower air pressure affects how baked goods rise and retain moisture. 
              Our adjustments compensate for these changes:
            </p>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg">
                <h4 className="font-semibold text-blue-800">Temperature +25°F</h4>
                <p className="text-sm text-blue-700">Sets structure faster before over-expansion</p>
              </div>
              <div className="bg-white p-4 rounded-lg">
                <h4 className="font-semibold text-blue-800">Less Leavening</h4>
                <p className="text-sm text-blue-700">Prevents excessive rise and collapse</p>
              </div>
              <div className="bg-white p-4 rounded-lg">
                <h4 className="font-semibold text-blue-800">More Liquid & Eggs</h4>
                <p className="text-sm text-blue-700">Combats rapid moisture loss</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TabbedMuffinRecipes;
