import unittest

from rag_support_assistant.router import should_escalate


class RouterTests(unittest.TestCase):
    def test_should_escalate_when_no_chunks(self):
        self.assertTrue(should_escalate("Where is my refund?", [], 0.9))

    def test_should_not_escalate_for_clear_supported_query(self):
        self.assertFalse(
            should_escalate(
                "How do I track my order?",
                ["Orders can be tracked from My Orders page."],
                0.64,
            )
        )


if __name__ == "__main__":
    unittest.main()
