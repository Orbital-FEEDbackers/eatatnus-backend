import { Food } from "@prisma/client";
import getNutritionalData from "./getNutritionalData.js";

export default async function transformItemsWithNutritionalInfo(items: Omit<Food, "id">[]): Promise<Omit<Food, "id">[]> {
    return Promise.all(
        items.map(async item => {
            const result = await getNutritionalData(item)
            if (result === null || !result.foods || result.foods.length === 0) {
                return { ...item };
            }

            const foodData = result.foods[0];
            
            return {
                ...item,
                servingQty: item.servingQty || foodData.serving_qty,
                servingUnit: item.servingUnit || foodData.serving_unit,
                servingWeightGrams: item.servingWeightGrams || foodData.serving_weight_grams,
                calories: item.calories || foodData.nf_calories,
                totalFat: item.totalFat || foodData.nf_total_fat,
                saturatedFat: item.saturatedFat || foodData.nf_saturated_fat,
                cholesterol: item.cholesterol || foodData.nf_cholesterol,
                sodium: item.sodium || foodData.nf_sodium,
                totalCarbohydrate: item.totalCarbohydrate || foodData.nf_total_carbohydrate,
                dietaryFiber: item.dietaryFiber || foodData.nf_dietary_fiber,
                sugars: item.sugars || foodData.nf_sugars,
                protein: item.protein || foodData.nf_protein,
                potassium: item.potassium || foodData.nf_potassium
            }
        })
    )
        .catch(error => {
            console.error(error.message);
            return items;
        })
}