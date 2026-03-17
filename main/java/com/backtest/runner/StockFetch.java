package com.backtest.runner;

import com.backtest.dto.stock.StockTopicRequest;
import com.backtest.dto.stock.StockTopicResponse;
import com.backtest.service.StockFetchService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class StockFetch implements CommandLineRunner {
    @Autowired
    private StockFetchService stockFetchService;

//    private final List<String> symbols = Arrays.asList(
//            // --- 1. Indici și ETF-uri Majore ---
//            "SPY", "QQQ", "DIA", "IWM", "VTI", "VEU", "EEM",
//
//            // --- 2. Tehnologie (Growth & Volatilitate) ---
//            "AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "TSLA", "META", "AVGO",
//            "ASML", "ADBE", "NFLX", "AMD", "INTC", "CRM", "ORCL", "CSCO",
//            "TXN", "QCOM",
//
//            // --- 3. Sectorul Financiar ---
//            "JPM", "BAC", "GS", "MS", "WFC", "V", "MA", "PYPL", "AXP", "XLF",
//
//            // --- 4. Energie și Materii Prime ---
//            "XOM", "CVX", "SHEL", "BP", "GLD", "SLV", "USO", "XLE", "CAT", "RIO",
//
//            // --- 5. Sănătate (Defensiv) ---
//            "JNJ", "PFE", "UNH", "LLY", "MRK", "ABBV", "TMO", "XLV",
//
//            // --- 6. Consum și Retail ---
//            "WMT", "TGT", "COST", "KO", "PEP", "NKE", "SBUX", "MCD", "HD", "PG", "XLP", "XLY",
//
//            // --- 7. Telecomunicații și Utilități ---
//            "T", "VZ", "CMCSA", "DIS", "NEE", "XLU",
//
//            // --- 8. ETF-uri Sectoriale și Tematice ---
//            "XLK", "XLI", "XLB", "SMH", "IBB", "ARKK", "ITA", "VNQ", "TAN",
//
//            // --- 9. ETF-uri Inverse și Leveraged ---
//            "TQQQ", "SQQQ", "SPXL", "SPXS", "UVXY",
//
//            // --- 10. Companii Internaționale (ADRs) ---
//            "BABA", "TM", "SAP", "HSBC", "SONY", "TSM",
//
//            // --- 11. Dividend Aristocrats ---
//            "MMM", "LOW", "ABT", "MO",
//
//            // --- 12. Obligațiuni (Bonds) ---
//            "TLT", "IEF", "BND", "LQD"
//    );

    private final List<String> symbols = Arrays.asList(
            // --- Indici & Benchmark-uri (Core) ---
            "SPY", "QQQ", "IWM", "DIA",

            // --- Tech & Growth (Lideri de piață) ---
            "AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "TSLA", "META", "AVGO", "ADBE", "NFLX",

            // --- Finanțe & Plăți ---
            "JPM", "BAC", "GS", "V", "MA", "PYPL",

            // --- Energie & Industrie ---
            "XOM", "CVX", "CAT", "BA",

            // --- Sănătate & Consum Defensiv ---
            "JNJ", "UNH", "PFE", "PG", "KO", "PEP", "WMT", "COST",

            // --- Metale & Obligațiuni (Hedge) ---
            "GLD", "TLT",

            // --- Semiconductori (High Beta) ---
            "SMH"
    );

    @Override
    public void run(String... args) throws Exception {
        List<StockTopicRequest> requests = symbols.stream().map(
                s -> {
                    return new StockTopicRequest(s, null, null, null);
                }
        ).toList();

        stockFetchService.getStocks(requests);
    }
}
