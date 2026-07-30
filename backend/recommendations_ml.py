"""
Item-Based Collaborative Filtering & Data Sufficiency Evaluation Module for Payent Recommendations.
"""

import math
from typing import Dict, List, Tuple
from database import get_interaction_matrix_data, save_precomputed_similarities

def check_data_sufficiency(min_users: int = 15, min_interactions: int = 30) -> Dict:
    """
    Evaluates whether the interaction dataset is dense enough for meaningful item-based collaborative filtering.
    Requires a reasonable spread of interactions per user across multiple products.
    """
    interactions = get_interaction_matrix_data()
    if not interactions:
        return {
            "sufficient": False,
            "user_count": 0,
            "product_count": 0,
            "interaction_count": 0,
            "reason": "No user interaction events found in database yet."
        }

    users = set()
    products = set()
    for row in interactions:
        if row.get("user_identifier"):
            users.add(row["user_identifier"])
        if row.get("product_id"):
            products.add(row["product_id"])

    user_count = len(users)
    product_count = len(products)
    interaction_count = len(interactions)

    if user_count < min_users or interaction_count < min_interactions:
        return {
            "sufficient": False,
            "user_count": user_count,
            "product_count": product_count,
            "interaction_count": interaction_count,
            "reason": f"Insufficient dataset volume ({user_count} users, {interaction_count} interactions; threshold is {min_users} users, {min_interactions} interactions). Recommendation system cleanly falling back to heuristic & cold-start algorithms."
        }

    return {
        "sufficient": True,
        "user_count": user_count,
        "product_count": product_count,
        "interaction_count": interaction_count,
        "reason": "Dataset has sufficient density for item-based collaborative filtering."
    }

def compute_cosine_similarity(vec1: Dict[str, float], vec2: Dict[str, float]) -> float:
    """Calculate cosine similarity between two item interaction vectors."""
    common_users = set(vec1.keys()) & set(vec2.keys())
    if not common_users:
        return 0.0

    dot_product = sum(vec1[u] * vec2[u] for u in common_users)
    norm1 = math.sqrt(sum(val ** 2 for val in vec1.values()))
    norm2 = math.sqrt(sum(val ** 2 for val in vec2.values()))

    if norm1 == 0 or norm2 == 0:
        return 0.0

    return dot_product / (norm1 * norm2)

def compute_and_save_item_similarities() -> Dict:
    """
    Computes item-item similarity matrix using item-based collaborative filtering (cosine similarity).
    Saves precomputed recommendations to MySQL table `item_similarities`.
    """
    evaluation = check_data_sufficiency()
    if not evaluation["sufficient"]:
        return {
            "success": False,
            "evaluated": evaluation,
            "message": evaluation["reason"]
        }

    interactions = get_interaction_matrix_data()
    # Build item -> {user: score} dictionary
    item_user_vectors: Dict[str, Dict[str, float]] = {}
    for row in interactions:
        u = row["user_identifier"]
        p = row["product_id"]
        score = float(row["interaction_score"])
        if p not in item_user_vectors:
            item_user_vectors[p] = {}
        item_user_vectors[p][u] = score

    products = list(item_user_vectors.keys())
    similarity_rows = []

    for i in range(len(products)):
        p1 = products[i]
        for j in range(i + 1, len(products)):
            p2 = products[j]
            sim = compute_cosine_similarity(item_user_vectors[p1], item_user_vectors[p2])
            if sim > 0.05:  # Only save meaningful similarity scores
                similarity_rows.append({"product_id_a": p1, "product_id_b": p2, "score": round(sim, 4)})
                similarity_rows.append({"product_id_a": p2, "product_id_b": p1, "score": round(sim, 4)})

    if similarity_rows:
        save_precomputed_similarities(similarity_rows)

    return {
        "success": True,
        "evaluated": evaluation,
        "matrix_pairs_computed": len(similarity_rows),
        "message": f"Successfully precomputed {len(similarity_rows)} item similarity pairs."
    }
