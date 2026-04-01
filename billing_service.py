
def get_prices(config) -> dict:
    return {
        "starter": config.get("STRIPE_PRICE_STARTER", ""),
        "pro": config.get("STRIPE_PRICE_PRO", ""),
        "max": config.get("STRIPE_PRICE_MAX", ""),
    }