using ForgeApi.Models;
using Microsoft.EntityFrameworkCore;

namespace ForgeApi.Data.Seeds;

public static class BankAliasSeeder
{
    public static async Task SeedAsync(AppDbContext context)
    {
        // Load all banks and existing aliases
        var banks = await context.Banks.Include(b => b.Aliases).ToListAsync();
        var bankByCode = new Dictionary<string, Bank>();
        var bankByName = new Dictionary<string, Bank>();
        foreach (var b in banks)
        {
            bankByCode.TryAdd(b.Code, b);
            bankByName.TryAdd(b.Name.ToLowerInvariant(), b);
        }

        var aliasMap = GetAliasMap();
        var newAliases = new List<BankAlias>();

        foreach (var (bankKey, aliases) in aliasMap)
        {
            // Find bank by code first, then by name
            Bank? bank = null;
            if (bankByCode.TryGetValue(bankKey, out var byCode))
                bank = byCode;
            else if (bankByName.TryGetValue(bankKey.ToLowerInvariant(), out var byName))
                bank = byName;

            if (bank == null) continue;

            var existingAliases = new HashSet<string>(
                bank.Aliases.Select(a => a.Alias.ToLowerInvariant()));

            foreach (var alias in aliases)
            {
                if (string.IsNullOrWhiteSpace(alias)) continue;
                var normalized = alias.Trim().ToLowerInvariant();

                // Skip if alias already exists or is the same as the bank name
                if (existingAliases.Contains(normalized)) continue;
                if (normalized == bank.Name.ToLowerInvariant()) continue;

                newAliases.Add(new BankAlias
                {
                    BankId = bank.Id,
                    Alias = alias.Trim()
                });
                existingAliases.Add(normalized);
            }
        }

        if (newAliases.Count == 0) return;

        context.BankAliases.AddRange(newAliases);
        await context.SaveChangesAsync();
    }

    /// <summary>
    /// Maps bank codes (or names) to their common aliases.
    /// Includes: abbreviations, acronyms, old names, PLC/Ltd variations, common misspellings, slang.
    /// </summary>
    private static Dictionary<string, string[]> GetAliasMap()
    {
        return new Dictionary<string, string[]>
        {
            // ═══════════════════════════════════════════════════════════════
            // TIER 1 — Major Commercial Banks (most commonly used)
            // ═══════════════════════════════════════════════════════════════

            ["044"] = new[] { // Access Bank
                "Access", "Access Bnk", "Access Bank Plc", "Access Bank Nigeria",
                "Access Bank PLC", "Access Bk", "Acess Bank", "Acces Bank",
                "Access Bnk Plc", "Diamond Bank", "Diamond", "Diamond Bnk",
                "Access Diamond", "Access (Diamond)"
            },

            ["058"] = new[] { // Guaranty Trust Bank (now GTBank / GTCo)
                "GTB", "GT Bank", "GTBank", "Gtbank", "GT Bnk", "GTB Plc",
                "Guaranty Trust", "Guaranty Trust Bank Plc", "Guaranty Trust Bnk",
                "Guaranty Trust Holding", "GTCo", "GT Co", "GTCO",
                "Guaranty", "Guarranty Trust Bank", "Guaranty Turst Bank",
                "GT Bank Plc", "Gtb Bank", "G T Bank", "G.T. Bank",
                "G T B", "Guranty Trust Bank"
            },

            ["011"] = new[] { // First Bank of Nigeria
                "First Bank", "FBN", "FirstBank", "First Bnk", "First Bank Plc",
                "First Bank Nigeria", "First Bank of Nigeria Plc",
                "First Bnk Nigeria", "1st Bank", "Fbn Bank", "FBN Plc",
                "First Bank PLC", "Firstbank Plc", "Frst Bank",
                "First Bk", "First Bank Nig", "First Bank Of Nig"
            },

            ["057"] = new[] { // Zenith Bank
                "Zenith", "Zenith Bnk", "Zenith Bank Plc", "Zenith Bank PLC",
                "Zenith Bank Nigeria", "Zenith Bk", "Zenith Bnk Plc",
                "Zennith Bank", "Zenith Plc", "Zenith International",
                "Zenith Bank International"
            },

            ["033"] = new[] { // United Bank for Africa
                "UBA", "Uba", "UBA Plc", "UBA PLC", "United Bank for Africa",
                "United Bank Africa", "UBA Bank", "Uba Plc", "Uba Bank",
                "U.B.A", "U B A", "United Bnk for Africa",
                "United Bank for Africa Plc", "UBA Nigeria"
            },

            ["032"] = new[] { // Union Bank
                "Union", "Union Bnk", "Union Bank Plc", "Union Bank Nigeria",
                "Union Bank of Nigeria", "Union Bank of Nigeria Plc",
                "Union Bk", "Union Bnk Plc"
            },

            ["221"] = new[] { // Stanbic IBTC
                "Stanbic", "Stanbic IBTC", "Stanbic IBTC Bank", "IBTC",
                "Stanbic IBTC Plc", "Stanbic Bank", "Stanbic IBTC Bank Plc",
                "Stanbic Ibtc", "Stanbic-IBTC", "IBTC Bank"
            },

            ["035"] = new[] { // Wema Bank
                "Wema", "Wema Bnk", "Wema Bank Plc", "Wema Bk",
                "Wema Bank PLC", "ALAT", "Alat by Wema",
                "Wema Bank Nigeria"
            },

            ["050"] = new[] { // Ecobank
                "Ecobank", "Eco Bank", "Ecobank Nigeria", "Eco Bnk",
                "Ecobank Plc", "Ecobank Nigeria Plc", "Eco Bank Plc",
                "Ecobank Transnational", "ECO", "Eco bank"
            },

            ["070"] = new[] { // Fidelity Bank
                "Fidelity", "Fidelity Bnk", "Fidelity Bank Plc",
                "Fidelity Bk", "Fidelity Bank PLC", "Fidelity Bank Nigeria",
                "Fidelity Bnk Plc"
            },

            ["076"] = new[] { // Polaris Bank
                "Polaris", "Polaris Bnk", "Polaris Bank Ltd",
                "Polaris Bank Nigeria", "Skye Bank", "Skye Bnk",
                "Skye", "Skye Bank Plc", "Polaris Bk"
            },

            ["039"] = new[] { // Keystone Bank
                "Keystone", "Keystone Bnk", "Keystone Bank Ltd",
                "Keystone Bank Nigeria", "Keystone Bk",
                "Bank PHB", "BankPHB", "Bank P.H.B"
            },

            ["023"] = new[] { // Citibank
                "Citi", "Citibank", "Citi Bank", "Citibank Nigeria",
                "Citibank Plc", "Citi Bank Nigeria", "Citibnk"
            },

            ["215"] = new[] { // Unity Bank
                "Unity", "Unity Bnk", "Unity Bank Plc",
                "Unity Bank Nigeria", "Unity Bk"
            },

            ["082"] = new[] { // Heritage Bank
                "Heritage", "Heritage Bnk", "Heritage Bank Plc",
                "Heritage Bank Nigeria", "Heritage Bk", "Heritage Banking"
            },

            ["030"] = new[] { // FCMB
                "FCMB", "First City Monument", "First City Monument Bank",
                "FCMB Plc", "First City", "FCMB Bank", "Fcmb",
                "F.C.M.B", "First City Monument Bank Plc",
                "First City Bnk", "FCM Bank"
            },

            ["068"] = new[] { // Standard Chartered
                "Standard Chartered", "Std Chartered", "StanChart",
                "Standard Chartered Bank", "Standard Chartered Nigeria",
                "Standard Chartered Bank Nigeria", "SC Bank",
                "Stan Chart", "Stanchart Bank"
            },

            ["214"] = new[] { // FCMB (if different code)
                "First City Monument Bank",
            },

            ["301"] = new[] { // Jaiz Bank
                "Jaiz", "Jaiz Bnk", "Jaiz Bank Plc",
                "Jaiz Islamic Bank", "Jaiz Bank Nigeria"
            },

            ["101"] = new[] { // Providus Bank
                "Providus", "Providus Bnk", "Providus Bank Ltd",
                "Providus Bank Nigeria", "Providus Bk"
            },

            ["104"] = new[] { // SunTrust Bank (now Titan Trust)
                "SunTrust", "Sun Trust", "SunTrust Bank",
                "Titan Trust", "Titan Trust Bank", "Titan"
            },

            ["232"] = new[] { // Sterling Bank
                "Sterling", "Sterling Bnk", "Sterling Bank Plc",
                "Sterling Bank Nigeria", "Sterling Bk",
                "Sterling Bank PLC", "Sterling Alternative Finance"
            },

            ["000012"] = new[] { // Standard Chartered (alt code)
                "Standard Chartered Bank Nigeria",
            },

            // ═══════════════════════════════════════════════════════════════
            // TIER 2 — Payment Service Banks & Digital Banks
            // ═══════════════════════════════════════════════════════════════

            ["999992"] = new[] { // OPay
                "OPay", "Opay", "O'Pay", "Opera Pay", "OPay Digital",
                "Opay Bank", "OPay PSB", "Opay Payment"
            },

            ["999991"] = new[] { // PalmPay
                "PalmPay", "Palm Pay", "Palmpay", "Palm Pay Bank",
                "PalmPay PSB"
            },

            ["100004"] = new[] { // Kuda
                "Kuda", "Kuda Bank", "Kuda Microfinance", "Kuda MFB",
                "Kuda Bnk"
            },

            ["090267"] = new[] { // Kuda MFB
                "Kuda", "Kuda Bank", "Kuda Microfinance Bank",
                "Kuda MFB"
            },

            ["100033"] = new[] { // Moniepoint
                "Moniepoint", "Monie Point", "MoniePoint MFB",
                "Moniepoint Bank", "TeamApt", "Moniepoint Microfinance"
            },

            ["120001"] = new[] { // 9 Payment Service Bank
                "9PSB", "9 Payment", "9 PSB", "9Payment",
                "9 Payment Service", "Nine PSB", "9mobile Bank"
            },

            ["100025"] = new[] { // Carbon (formerly Paylater)
                "Carbon", "Paylater", "Pay Later", "Carbon Bank",
                "Carbon Finance"
            },

            ["100034"] = new[] { // Mint Finex MFB
                "Mint", "Mint MFB", "Mint Finex", "Mint Bank"
            },

            // ═══════════════════════════════════════════════════════════════
            // TIER 3 — Major Microfinance Banks
            // ═══════════════════════════════════════════════════════════════

            ["090405"] = new[] { // Moniepoint MFB
                "Moniepoint", "Moniepoint MFB", "Monie Point MFB",
                "TeamApt"
            },

            ["090110"] = new[] { // VFD MFB
                "VFD", "VFD Microfinance", "VFD MFB", "V Bank",
                "VBank", "VFD Bank"
            },

            ["090180"] = new[] { // AMJU Unique MFB
                "AMJU", "Amju Unique", "AMJU MFB"
            },

            ["090003"] = new[] { // Jubilee Life Mortgage Bank
                "Jubilee Life", "Jubilee"
            },

            ["060001"] = new[] { // Coronation Merchant Bank
                "Coronation", "Coronation Bank", "Coronation Merchant"
            },

            ["060002"] = new[] { // FSDH Merchant Bank
                "FSDH", "FSDH Bank", "FSDH Merchant"
            },

            ["060003"] = new[] { // Nova Merchant Bank
                "Nova", "Nova Bank", "Nova Merchant"
            },

            ["060004"] = new[] { // Greenwich Merchant Bank
                "Greenwich", "Greenwich Bank", "Greenwich Merchant"
            },

            // ═══════════════════════════════════════════════════════════════
            // TIER 4 — Mobile Money & Wallets
            // ═══════════════════════════════════════════════════════════════

            ["100002"] = new[] { // Paga
                "Paga", "Paga MFB", "myPaga", "Paga Bank"
            },

            ["100003"] = new[] { // Paystack Titan
                "Paystack", "Paystack Titan", "Paystack Payments"
            },

            ["100014"] = new[] { // FET (FirstMonie)
                "FirstMonie", "First Monie", "FET", "First Monie Wallet"
            },

            ["100013"] = new[] { // AccessMobile
                "AccessMobile", "Access Mobile"
            },

            ["100035"] = new[] { // Woven Finance
                "Woven", "Woven Finance"
            },

            ["100006"] = new[] { // SafeHaven MFB
                "SafeHaven", "Safe Haven", "SafeHaven MFB"
            },

            ["100031"] = new[] { // FCMB Easy Account
                "FCMB Easy", "FCMB Easy Account"
            },

            ["100030"] = new[] { // EcoMobile
                "EcoMobile", "Eco Mobile", "Ecobank Mobile"
            },

            ["100005"] = new[] { // Cellulant
                "Cellulant"
            },

            ["100008"] = new[] { // Zenith eaZymoney
                "eaZymoney", "Zenith eaZymoney", "Zenith Easy Money"
            },

            ["100026"] = new[] { // Eyowo
                "Eyowo", "Eyowo MFB"
            },

            // ═══════════════════════════════════════════════════════════════
            // TIER 5 — Mortgage & Specialized Banks
            // ═══════════════════════════════════════════════════════════════

            ["070010"] = new[] { // Abbey Mortgage
                "Abbey", "Abbey Mortgage", "Abbey Mortgage Bank"
            },

            ["070011"] = new[] { // Brent Mortgage Bank
                "Brent", "Brent Mortgage"
            },

            ["070009"] = new[] { // Gateway Mortgage Bank
                "Gateway", "Gateway Mortgage"
            },

            ["070012"] = new[] { // Infinity Mortgage Bank
                "Infinity", "Infinity Mortgage"
            },

            ["070014"] = new[] { // ASO Savings
                "ASO", "ASO Savings", "ASO Savings and Loans"
            },

            // ═══════════════════════════════════════════════════════════════
            // TIER 6 — Common Microfinance Banks
            // ═══════════════════════════════════════════════════════════════

            ["090115"] = new[] { // TCF MFB
                "TCF", "TCF MFB", "TCF Microfinance"
            },

            ["090001"] = new[] { // ASOSavings
                "ASO", "ASO Savings"
            },

            ["090134"] = new[] { // Accion MFB
                "Accion", "Accion MFB", "Accion Microfinance"
            },

            ["090270"] = new[] { // AB Microfinance Bank
                "AB MFB", "AB Microfinance", "AB Bank"
            },

            ["090136"] = new[] { // Baobab MFB
                "Baobab", "Baobab MFB", "Baobab Microfinance", "Microcred"
            },

            ["090325"] = new[] { // Sparkle MFB
                "Sparkle", "Sparkle MFB", "Sparkle Bank"
            },

            ["090139"] = new[] { // Visa Microfinance Bank
                "Visa MFB", "Visa Microfinance"
            },

            ["090175"] = new[] { // Rubies MFB
                "Rubies", "Rubies MFB", "Rubies Bank", "Rubies Microfinance"
            },

            ["090272"] = new[] { // Olabisi Onabanjo University MFB
                "OOU MFB", "OOU Microfinance"
            },

            ["323"] = new[] { // Access Money
                "Access Money", "AccessMoney"
            },

            ["304"] = new[] { // Stanbic Mobile
                "Stanbic Mobile"
            },

            ["327"] = new[] { // Globus Bank
                "Globus", "Globus Bnk", "Globus Bank Ltd"
            },

            ["103"] = new[] { // Globus Bank (alt)
                "Globus", "Globus Bank"
            },

            ["100032"] = new[] { // Contec Global
                "Contec", "Contec Global"
            },

            ["090196"] = new[] { // Pennywise Microfinance Bank
                "Pennywise", "Pennywise MFB"
            },

            ["090198"] = new[] { // RenMoney MFB
                "RenMoney", "Ren Money", "RenMoney MFB"
            },

            ["090194"] = new[] { // KCMB Microfinance Bank
                "KCMB", "KCMB MFB"
            },

            ["090205"] = new[] { // New Dawn MFB
                "New Dawn", "New Dawn MFB"
            },

            ["090251"] = new[] { // UNN MFB
                "UNN MFB", "University of Nigeria MFB"
            },

            ["090259"] = new[] { // Alekun MFB
                "Alekun", "Alekun MFB"
            },

            ["090285"] = new[] { // First Option MFB
                "First Option", "First Option MFB"
            },

            ["090286"] = new[] { // Safe Haven MFB
                "Safe Haven", "SafeHaven MFB"
            },

            ["090328"] = new[] { // Eyowo MFB
                "Eyowo", "Eyowo MFB"
            },

            ["090331"] = new[] { // UNAAB MFB
                "UNAAB", "UNAAB MFB", "FUNAAB MFB"
            },

            ["090332"] = new[] { // Evergreen MFB
                "Evergreen", "Evergreen MFB"
            },

            ["090360"] = new[] { // Cashconnect MFB
                "Cashconnect", "Cash Connect", "Cashconnect MFB"
            },

            ["090362"] = new[] { // Molusi MFB
                "Molusi", "Molusi MFB"
            },

            ["090363"] = new[] { // Headway MFB
                "Headway", "Headway MFB"
            },

            ["090364"] = new[] { // Numo MFB
                "Numo", "Numo MFB"
            },

            ["090365"] = new[] { // Corestep MFB
                "Corestep", "Corestep MFB"
            },

            ["090366"] = new[] { // Firmus MFB
                "Firmus", "Firmus MFB"
            },

            ["090372"] = new[] { // Ilaro Poly MFB
                "Ilaro Poly", "Ilaro MFB"
            },

            ["090385"] = new[] { // GTI MFB
                "GTI", "GTI MFB"
            },

            ["090392"] = new[] { // Mozfin MFB
                "Mozfin", "Mozfin MFB"
            },

            ["090393"] = new[] { // Bridgeway MFB
                "Bridgeway", "Bridgeway MFB"
            },

            ["090395"] = new[] { // Borgu MFB
                "Borgu", "Borgu MFB"
            },

            ["090400"] = new[] { // Finca MFB
                "Finca", "Finca MFB", "Finca Microfinance"
            },

            ["090404"] = new[] { // Zikora MFB
                "Zikora", "Zikora MFB"
            },

            ["090406"] = new[] { // Business Support MFB
                "Business Support", "BSM MFB"
            },

            ["090426"] = new[] { // Tanadi MFB
                "Tanadi", "Tanadi MFB"
            },

            ["090428"] = new[] { // Shepherd Trust MFB
                "Shepherd Trust", "Shepherd MFB"
            },

            ["090460"] = new[] { // Cashbridge MFB
                "Cashbridge", "Cash Bridge", "Cashbridge MFB"
            },

            ["090470"] = new[] { // DOT MFB
                "DOT", "DOT MFB", "Dot Microfinance"
            },

            ["090480"] = new[] { // Citi Trust MFB
                "Citi Trust", "CitiTrust MFB"
            },

            ["090487"] = new[] { // Fortress MFB
                "Fortress", "Fortress MFB"
            },

            ["090495"] = new[] { // Prisco MFB
                "Prisco", "Prisco MFB"
            },

            ["090529"] = new[] { // Bankly MFB
                "Bankly", "Bankly MFB"
            },

            ["090545"] = new[] { // Abulesoro MFB
                "Abulesoro", "Abulesoro MFB"
            },

            ["090551"] = new[] { // Fairmoney MFB
                "Fairmoney", "Fair Money", "FairMoney MFB", "Fairmoney Microfinance"
            },

            ["090556"] = new[] { // Lifegate MFB
                "Lifegate", "Lifegate MFB"
            },

            ["110005"] = new[] { // 3Line Card Management
                "3Line", "3 Line", "ThreeLine"
            },

            ["050005"] = new[] { // Aaa Finance
                "AAA", "AAA Finance", "Triple A"
            },

            // ═══════════════════════════════════════════════════════════════
            // TIER 7 — Additional Payment Providers
            // ═══════════════════════════════════════════════════════════════

            ["110006"] = new[] { // Flutterwave Technology Solutions
                "Flutterwave", "Flutter Wave", "Flutterwave PSB",
                "FLW", "Rave by Flutterwave"
            },

            ["110007"] = new[] { // TeamApt
                "TeamApt", "Team Apt", "Moniepoint PSB"
            },

            ["110009"] = new[] { // Interswitch
                "Interswitch", "Inter Switch"
            },

            ["100009"] = new[] { // Stanbic IBTC Mobile
                "Stanbic Mobile", "Stanbic IBTC Mobile"
            },

            ["100011"] = new[] { // ReadyCash
                "ReadyCash", "Ready Cash"
            },

            ["100015"] = new[] { // GTMobile
                "GTMobile", "GT Mobile", "GTBank Mobile"
            },

            ["100016"] = new[] { // Fortis Mobile
                "Fortis", "Fortis Mobile"
            },

            ["100020"] = new[] { // Fidelity Mobile
                "Fidelity Mobile"
            },

            ["100021"] = new[] { // Eartholeum
                "Eartholeum"
            },

            ["100022"] = new[] { // GoMoney
                "GoMoney", "Go Money"
            },

            ["100023"] = new[] { // TagPay
                "TagPay", "Tag Pay"
            },

            ["100024"] = new[] { // Intellifin
                "Intellifin"
            },
        };
    }
}
