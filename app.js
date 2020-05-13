///////////// Budget Controller

let budgetController = (function () {
  // Create function constructor to store expense and income data. Can create new item by making an instance object of the function constructor

  let Expense = function (id, description, value) {
    this.id = id;
    this.description = description;
    this.value = value;
    this.percentage = -1;
  };

  Expense.prototype.calcPercentage = function (totalIncome) {
    if (totalIncome > 0) {
      this.percentage = Math.round((this.value / totalIncome) * 100);
    } else {
      this.percentage = -1;
    } // machine that Calculates percentage for that specific instance of expense
  };

  Expense.prototype.getPercentage = function () {
    return this.percentage;
  };

  let Income = function (id, description, value) {
    this.id = id;
    this.description = description;
    this.value = value;
  };

  let calculateTotal = function (type) {
    let sum = 0;
    data.allItems[type].forEach(function (cur) {
      sum += cur.value;
    });
    data.totals[type] = sum;
  };

  let data = {
    // Instead of having few data structures flowing around, wrangle them up into one big one
    allItems: {
      exp: [], //Store created expense and income instancels into arrays
      inc: [], //Store created expense and income instances into arrays
    },
    totals: {
      exp: 0,
      inc: 0,
    },
    budget: 0,
    percentage: -1, //Set to -1 for nonexistent. If no budget values and total values, the percentage doesnt exist yet
  };

  return {
    addItem: function (type, des, val) {
      let newItem, ID;
      //Create new ID. If array is empty, the ID default is zero
      if (data.allItems[type].length > 0) {
        ID = data.allItems[type][data.allItems[type].length - 1].id + 1; // Last ID + 1
      } else {
        ID = 0;
      }

      //Create new item based on inc or exp type
      if (type === "exp") {
        newItem = new Expense(ID, des, val);
      } else {
        newItem = new Income(ID, des, val);
      }
      // Push into data structure
      data.allItems[type].push(newItem);

      // Return the new element
      return newItem;
    },

    deleteItem: function (type, id) {
      let ids, index;
      ids = data.allItems[type].map(function (current) {
        return current.id;
      });

      index = ids.indexOf(id); // Create a new array of ids, and use the given id to here to find its index

      if (index !== -1) {
        //Run if the id we pass is in the array
        data.allItems[type].splice(index, 1);
      }
    },

    calculateBudget: function () {
      // Calculate total income and expenses
      calculateTotal("exp");
      calculateTotal("inc");

      // Calculate budget: income -  expenses
      data.budget = data.totals.inc - data.totals.exp;

      // Calculate percentage of income spent when income greater than 0
      if (data.totals.inc > 0) {
        data.percentage = Math.round((data.totals.exp / data.totals.inc) * 100);
      } else {
        data.percentage = -1;
      }
    },

    getbudget: function () {
      return {
        budget: data.budget,
        totalInc: data.totals.inc,
        totalExp: data.totals.exp,
        percentage: data.percentage,
      };
    },

    calculatePercentages: function () {
      data.allItems.exp.forEach(function (cur) {
        cur.calcPercentage(data.totals.inc); //This is the prototype
      }); // Getting the calcPercentage prototype machine to do its thing over all instances of expenses/ update their this.percentage value that each instance has
    },

    getPercentages: function () {
      let allPerc = data.allItems.exp.map(function (cur) {
        return cur.getPercentage(); // This is the prototype
      }); // puts the this.percentage values that belong to all expense instances into an array
      return allPerc;
    },

    testing: function () {
      console.log(data);
    },
  };
})();

//////////// UI Controller
let UIController = (function () {
  let DOMStrings = {
    // In case UI changes in the future, have all the DOM names in one spot to track easier
    inputType: ".add__type",
    inputDescription: ".add__description",
    inputValue: ".add__value",
    inputBtn: ".add__btn",
    incomeContainer: ".income__list",
    expensesContainer: ".expenses__list",
    budgetLabel: ".budget__value",
    incomeLabel: ".budget__income--value",
    expensesLabel: ".budget__expenses--value",
    percentageLabel: ".budget__expenses--percentage",
    container: ".container",
    expensesPercLabel: ".item__percentage",
    dateLabel: ".budget__title--month",
  };

  let formatNumber = function (num, type) {
    // Moved up here to be a private function since no other controller will be using this function
    let numSplit, int, dec;
    // - or + before the number. Exactly 2 decimal points. And comma separathing thousands
    // 2310.451 -> + 2,310.46 etc

    // Get the absolute number, aka without the signs
    num = Math.abs(num);
    // Force two decimal places *This converts a number into a str*
    num = num.toFixed(2);
    // Adding commas to thousands. We split the integers and decimals since its now a string
    numSplit = num.split("."); //2314.23 -> "2314" "." "23"

    int = numSplit[0]; //"2314"
    //Then we use if else statement on the int (still a string), we can use length on it like an array
    if (int.length > 3) {
      //int = int.substr(0,1) + ',' + int.substr(1,3) //input 2310, output 2,310
      //Above is hardcoded, what if we have 23510? We use length prop to make it dynamic
      int = int.substr(0, int.length - 3) + "," + int.substr(int.length - 3, 3); //input 23510, output 23,510
      /*in the first substr, it takes out 23 (starts out at index 0, and removes first 2 chars since length of 5-3 = 2). add a comma, then second substr begins where the last ended, and includes the rest of the string thats left*/
    }

    dec = numSplit[1]; //"23";

    //type ='exp' ? sign = '-' : sign = '+';

    return (type === "exp" ? "-" : "+") + " " + int + "." + dec;
  };

  let nodeListForEach = function (list, callback) {
    for (let i = 0; i < list.length; i++) {
      callback(list[i], i);
    }
  };

  return {
    getinput: function () {
      // method for returning all 3 inputs in UI
      return {
        type: document.querySelector(DOMStrings.inputType).value, //will either be inc or exp
        description: document.querySelector(DOMStrings.inputDescription).value,
        value: parseFloat(document.querySelector(DOMStrings.inputValue).value),
      };
    },

    addListItem: function (obj, type) {
      let html, newHtml, element;
      // Create HTML string with placeholder text
      if (type === "inc") {
        element = DOMStrings.incomeContainer;

        html =
          '<div class="item clearfix" id="inc-%id%"> <div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>';
      } else if (type === "exp") {
        element = DOMStrings.expensesContainer;

        html =
          '<div class="item clearfix" id="exp-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__percentage">21%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>';
      }

      // Replace placeholder text with actual data from obj
      newHtml = html.replace("%id%", obj.id);
      newHtml = newHtml.replace("%description%", obj.description);
      newHtml = newHtml.replace("%value%", formatNumber(obj.value, type));

      // Insert HTML into dom
      document.querySelector(element).insertAdjacentHTML("beforeend", newHtml); // The inc or exp will be inserted as the last child of its parent list
    },

    deleteListItem: function (selectorID) {
      let element = document.getElementById(selectorID);
      element.parentNode.removeChild(element);
    },

    clearFields: function () {
      let fields, fieldsArr;

      fields = document.querySelectorAll(
        DOMStrings.inputDescription + "," + DOMStrings.inputValue
      ); // Syntax like css selecting using comma

      fieldsArr = Array.prototype.slice.call(fields); //tricks slice method into thinking fields is an array, not a method (With call(), an object can use a method belonging to another object.)

      fieldsArr.forEach(function (current, index, array) {
        current.value = "";
      });

      //fields.forEach((element) => (element.value = "")); //Rewritten the above using forEach arrow function. seems to work just fine.

      fieldsArr[0].focus();
    },

    displayBudget: function (obj) {
      let type;
      obj.budget > 0 ? (type = "inc") : (type = "exp");

      document.querySelector(DOMStrings.budgetLabel).textContent = formatNumber(
        obj.budget,
        type
      );
      document.querySelector(DOMStrings.incomeLabel).textContent = formatNumber(
        obj.totalInc,
        "inc"
      );
      document.querySelector(
        DOMStrings.expensesLabel
      ).textContent = formatNumber(obj.totalExp, "exp");

      if (obj.percentage > 0) {
        document.querySelector(DOMStrings.percentageLabel).textContent =
          obj.percentage + "%";
      } else {
        document.querySelector(DOMStrings.percentageLabel).textContent = "--";
      }
    },

    displayPercentages: function (percentages) {
      // Dont worry, it is already passed thru in the global app controller under updatePercentages
      let fields = document.querySelectorAll(DOMStrings.expensesPercLabel); //this returns a nodelist

      //The below is just calling the function. It similar to nodeListForEach(fields, a). its just that here we wrote the function directly into the call. See that it takes in the fields variable from above a few lines.

      // * For callback, you can write callback functions DIRECTLY as an argument
      nodeListForEach(fields, function (current, index) {
        if (percentages[index] > 0) {
          current.textContent = percentages[index] + "%"; // In the first element we want the first percentage, the second percentage in the second element, etc
        } else {
          current.textContent = "--";
        }
      });
    },

    displayMonth: function () {
      let now, year;
      now = new Date();
      // Can use methods on the variable to get year, day, etc

      months = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ]; //Use month as an index number to get the correct month name

      month = now.getMonth(); // gives a number
      year = now.getFullYear();
      document.querySelector(DOMStrings.dateLabel).textContent =
        months[month] + " " + year;
    },

    changedType: function () {
      let fields = document.querySelectorAll(
        DOMStrings.inputType +
          "," +
          DOMStrings.inputDescription +
          "," +
          DOMStrings.inputValue
      ); // Can select multiple classes, but this returns a nodelist, so we neeed to use our previously made nodelist function

      nodeListForEach(fields, function (cur) {
        cur.classList.toggle("red-focus");
      });

      document.querySelector(DOMStrings.inputBtn).classList.toggle("red");
    },

    getDOMStrings: function () {
      return DOMStrings; // Exposing DOMStrings object to the public
    },
  };
})();

//////////////// Global App Controller
let controller = (function (budgetCtrl, UICtrl) {
  let setUpEventListener = function () {
    let DOM = UICtrl.getDOMStrings();

    document.querySelector(DOM.inputBtn).addEventListener("click", ctrlAddItem); // No need callback, aka () as the addeventlistener will call it when necesearry

    document.addEventListener("keypress", function (event) {
      // Execute code when return key is hit. Use event.which for older browser support
      if (event.keyCode === 13 || event.which === 13) {
        ctrlAddItem();
      }
    });
    document
      .querySelector(DOM.inputType)
      .addEventListener("change", UICtrl.changedType);

    document
      .querySelector(DOM.container)
      .addEventListener("click", ctrlDeleteItem);
  };

  let updateBudget = function () {
    //Budget will be updated once you add AND delete an item, so better ot make it a new function
    // 1. Calculate the budget
    budgetCtrl.calculateBudget();

    // 2. Method that returns budget
    let budget = budgetCtrl.getbudget();

    // 3.  Display budget in UI
    UICtrl.displayBudget(budget);
  };

  let updatePercentages = function () {
    //1 . Calculate percentages
    budgetCtrl.calculatePercentages();
    //2. Read percentages from budget controller
    let percentages = budgetCtrl.getPercentages();
    //3. Update UI with new percentages
    UICtrl.displayPercentages(percentages);
  };

  let ctrlAddItem = function () {
    let input, newItem;

    // 1. Get filed input data
    input = UICtrl.getinput();

    if (input.description !== "" && !isNaN(input.value) && input.value > 0) {
      // 2. Add item to budget controller
      newItem = budgetCtrl.addItem(input.type, input.description, input.value);
      // 3. Add new item to UI
      UICtrl.addListItem(newItem, input.type);

      // 4. Clear fields
      UICtrl.clearFields();

      // 5. Calculate and update budget
      updateBudget();

      //6. Calculate and update percentage
      updatePercentages();
    }
  };

  let ctrlDeleteItem = function (event) {
    let itemID, splitID, type, ID;
    // When an event bubbles up, you can see where it was first trigged using the target property.
    itemID = event.target.parentNode.parentNode.parentNode.parentNode.id; //Moves up/DOM traverse to the parent element with the, since using that we can delete the whole thing

    if (itemID) {
      //Split the ID string, since it has type and ID number in side we can assign those to variables
      //Imagine an ID like so -> "inc-0" will be broken down like so
      splitID = itemID.split("-"); // "inc" "-" "0"
      type = splitID[0]; // -> "inc"
      ID = parseInt(splitID[1]); //-> "0". This is a whole number/ integer/no decimals, so use parseInt instead of parseFloat -> 0
    }
    //1 . Delete item from data structure
    budgetCtrl.deleteItem(type, ID);

    //2. Delete item from UI

    UICtrl.deleteListItem(itemID);

    //3. Update and show new budget
    updateBudget();

    //4. Calculate and update percentage
    updatePercentages();
  };

  return {
    // A public Initilizaiton function to auto execute other functions once init is called
    init: function () {
      console.log("Application started");
      UICtrl.displayMonth();
      UICtrl.displayBudget({
        budget: 0,
        totalInc: 0,
        totalExp: 0,
        percentage: 0,
      });
      setUpEventListener();
    },
  };
})(budgetController, UIController);

controller.init(); // Without this line of code, nothing else will run
