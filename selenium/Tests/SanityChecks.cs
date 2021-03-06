using System.Collections.Generic;
using OpenQA.Selenium;

namespace SeleniumTests.Tests
{
    /// <summary>
    /// Contains tests that are essentially just sanity checks.
    /// </summary>
    public static class SanityChecks
    {
        public static readonly TestCase CheckTitle =
            new TestCase(
                "Page title must be right",
                (driver, log) =>
                {
                    Assert.AreEqual(driver.Title, "UnSHACLed Editor");
                });

        public static readonly TestCase AboutWorks =
            new TestCase(
                "About page can be accessed",
                (driver, log) =>
                {
                    // Grab the 'about' navbar item.
                    var elem = driver.FindElement(By.Id("navbarItemAbout"));
                    // Click it.
                    elem.Click();
                    // Check that we're at '#/about'.
                    Assert.IsTrue(driver.Url.EndsWith("#/about"));
                });

        /// <summary>
        /// A list of all sanity check tests.
        /// </summary>
        public static readonly IEnumerable<TestCase> All =
            new[]
        {
            CheckTitle,
            AboutWorks
        };
    }
}
